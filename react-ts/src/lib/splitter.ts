import { ZODIAC_MAP_2026, type Bet } from './parser';

interface SubBet {
  groupIndex: number;
  code: string;
  amount: number;
}

/** 找出当前剩余注单中仍然完整的生肖（该生肖全部号码都还有余额） */
function getCompleteZodiacs(remaining: Map<string, number>): string[] {
  const complete: string[] = [];
  for (const [name, codes] of Object.entries(ZODIAC_MAP_2026)) {
    if (codes.every((c) => (remaining.get(c) ?? 0) > 0)) {
      complete.push(name);
    }
  }
  return complete.sort(() => Math.random() - 0.5);
}

/** 从 [minAmount, remaining] 范围内随机取一个 step 对齐的整数，偏向取大额 */
function randomStepAmount(remaining: number, minAmount: number, step: number): number {
  if (remaining <= minAmount) return remaining;
  const maxSteps = Math.floor((remaining - minAmount) / step);
  const steps = Math.floor(Math.random() * (maxSteps + 1));
  return remaining - steps * step;
}

function assignCodesToGroup(
  groupIndex: number,
  codes: string[],
  remaining: Map<string, number>,
  minAmount: number,
  step: number,
  clearAll: boolean,
  forcedAmount?: number
): SubBet[] {
  const validCodes = codes.filter((c) => (remaining.get(c) ?? 0) > 0);
  if (validCodes.length === 0) return [];
  const minRemaining = Math.min(...validCodes.map((c) => remaining.get(c) ?? 0));
  const amount = forcedAmount ?? randomStepAmount(minRemaining, minAmount, step);
  const assigned: SubBet[] = [];
  for (const code of validCodes) {
    const left = remaining.get(code) ?? 0;
    const part1 = Math.min(amount, left);
    assigned.push({ groupIndex, code, amount: part1 });
    const rest = left - part1;
    if (rest > 0) {
      if (clearAll) {
        assigned.push({ groupIndex, code, amount: rest });
        remaining.delete(code);
      } else {
        remaining.set(code, rest);
      }
    } else {
      remaining.delete(code);
    }
  }
  return assigned;
}

function distributeBets(
  bets: Bet[],
  groups: number,
  minAmount: number,
  step: number
): { groupBets: SubBet[][]; groupZodiacs: (string | null)[] } {
  const groupBets: SubBet[][] = Array.from({ length: groups }, () => []);
  const groupZodiacs: (string | null)[] = Array.from({ length: groups }, () => null);

  // 聚合 code -> 剩余金额
  const remaining = new Map<string, number>();
  for (const b of bets) {
    remaining.set(b.code, (remaining.get(b.code) ?? 0) + b.amount);
  }

  // 预先为前 groups-1 组各分配一个不同的完整生肖
  const completeZodiacs = getCompleteZodiacs(remaining);
  const assignedZodiac: (string | null)[] = Array.from({ length: groups }, () => null);
  for (let i = 0; i < groups - 1 && i < completeZodiacs.length; i++) {
    assignedZodiac[i] = completeZodiacs[i];
  }

  // 收集已分配生肖的号码，普通号码阶段不再碰它们，确保每组生肖独立成段
  const protectedCodes = new Set<string>();

  // 第一轮：先把生肖分配到前 groups-1 组
  for (let i = 0; i < groups - 1; i++) {
    const zodiacName = assignedZodiac[i];
    if (!zodiacName) continue;
    groupZodiacs[i] = zodiacName;
    const codes = ZODIAC_MAP_2026[zodiacName];
    for (const code of codes) protectedCodes.add(code);
    const minRemaining = Math.min(...codes.map((c) => remaining.get(c) ?? 0));
    if (minRemaining <= 0) continue;
    const amount = randomStepAmount(minRemaining, minAmount, step);
    for (const code of codes) {
      groupBets[i].push({ groupIndex: i, code, amount });
      const left = (remaining.get(code) ?? 0) - amount;
      if (left <= 0) remaining.delete(code);
      else remaining.set(code, left);
    }
  }

  // 第二轮：分配普通号码（避开生肖号码）
  function getShuffledRegularCodes(): string[] {
    return [...remaining.keys()]
      .filter((c) => (remaining.get(c) ?? 0) > 0 && !protectedCodes.has(c))
      .sort(() => Math.random() - 0.5);
  }

  for (let i = 0; i < groups; i++) {
    const isLast = i === groups - 1;
    const codesLeft = getShuffledRegularCodes();

    if (isLast) {
      // 最后一组：兜底剩余所有号码（包括生肖剩余）
      for (const [code, amount] of remaining) {
        if (amount <= 0) continue;
        groupBets[i].push({ groupIndex: i, code, amount });
      }
      remaining.clear();
      continue;
    }

    // 普通号码：按剩余数量比例取一批号码，再拆成两档金额，确保输出 2 段
    if (codesLeft.length > 0) {
      // 按你原定的比例规则计算取多少个
      function pickCountByRatio(n: number): number {
        if (n > 25) return Math.max(1, Math.ceil(n * 0.3));
        if (n > 15) return Math.max(1, Math.ceil(n * 0.8));
        if (n > 5) return Math.max(1, Math.ceil(n * 0.5));
        return Math.max(1, Math.min(n, Math.floor(Math.random() * 3) + 1));
      }

      const pickCount = Math.min(codesLeft.length, pickCountByRatio(codesLeft.length));
      // 优先取剩余金额较大的号码，前一半给高档、后一半给低档
      const picked = codesLeft
        .slice()
        .sort((a, b) => (remaining.get(b) ?? 0) - (remaining.get(a) ?? 0))
        .slice(0, pickCount);

      if (picked.length > 0) {
        const half = Math.max(1, Math.ceil(picked.length / 2));
        const batch1 = picked.slice(0, half);
        const batch2 = picked.slice(half);

        const minRemaining1 = Math.min(
          ...batch1.map((c) => remaining.get(c) ?? 0)
        );
        const minRemaining2 = Math.min(
          ...batch2.map((c) => remaining.get(c) ?? 0)
        );

        // 高档金额随机但不低于 20；低档固定 10，确保两段不合并
        let amount1 = randomStepAmount(minRemaining1, minAmount, step);
        if (minRemaining1 >= minAmount + step) {
          amount1 = Math.max(amount1, minAmount + step);
        }
        let amount2 = minAmount;
        if (amount2 === amount1 && minRemaining2 >= minAmount + step) {
          amount2 = minAmount + step;
        }

        groupBets[i].push(
          ...assignCodesToGroup(i, batch1, remaining, minAmount, step, false, amount1)
        );
        if (batch2.length > 0) {
          groupBets[i].push(
            ...assignCodesToGroup(i, batch2, remaining, minAmount, step, false, amount2)
          );
        }
      }
    }
  }

  return { groupBets, groupZodiacs };
}

/** 合并同组内完全相同的 code:amount，迭代直到无冲突 */
function mergeDuplicateCodes(groupBets: SubBet[][]): SubBet[][] {
  return groupBets.map((group) => {
    let list = group.map((b) => ({ ...b }));
    let changed = true;
    while (changed) {
      changed = false;
      const map = new Map<string, SubBet>();
      const next: SubBet[] = [];
      for (const b of list) {
        const key = `${b.code}:${b.amount}`;
        const existing = map.get(key);
        if (existing) {
          existing.amount += b.amount;
          changed = true;
        } else {
          const copy = { ...b };
          map.set(key, copy);
          next.push(copy);
        }
      }
      list = next;
    }
    return list;
  });
}

export function splitBets(
  bets: Bet[],
  groups: number,
  minAmount: number,
  step = 10,
  _minCodes = 1
): string[] {
  if (!Array.isArray(bets) || bets.length === 0) {
    throw new Error('拆单失败：注单为空');
  }
  if (!Number.isInteger(groups) || groups <= 0) {
    throw new Error('拆单失败：组数必须为正整数');
  }
  if (!Number.isInteger(minAmount) || minAmount < 0) {
    throw new Error('拆单失败：最低金额必须为非负整数');
  }
  if (!Number.isInteger(step) || step <= 0) {
    throw new Error('拆单失败：倍数步长必须为正整数');
  }

  const { groupBets, groupZodiacs } = distributeBets(bets, groups, minAmount, step);
  const merged = mergeDuplicateCodes(groupBets);

  return merged
    .filter((g) => g.length > 0)
    .map((g, idx) => {
      const primaryZodiac = groupZodiacs[idx];
      const sorted = g.sort((a, b) => a.code.localeCompare(b.code));
      const amountMap = new Map<number, string[]>();
      for (const b of sorted) {
        const list = amountMap.get(b.amount) ?? [];
        list.push(b.code);
        amountMap.set(b.amount, list);
      }

      const parts: string[] = [];
      for (const [amount, codes] of [...amountMap.entries()].sort((a, b) => a[0] - b[0])) {
        const remaining = [...codes];
        let zodiacName: string | null = null;

        // 只合并该组预先分配的主生肖，避免普通号码凑出额外生肖段
        if (primaryZodiac) {
          const zodiacCodes = ZODIAC_MAP_2026[primaryZodiac];
          const set = new Set(remaining);
          if (zodiacCodes.every((c) => set.has(c))) {
            zodiacName = primaryZodiac;
            for (const c of zodiacCodes) {
              const idx = remaining.indexOf(c);
              if (idx !== -1) remaining.splice(idx, 1);
            }
          }
        }

        const partsForAmount: string[] = [];
        if (zodiacName) {
          partsForAmount.push(`${zodiacName}各${amount}`);
        }
        if (remaining.length > 0) {
          partsForAmount.push(
            `${remaining.sort((a, b) => a.localeCompare(b)).join('-')}各${amount}`
          );
        }
        parts.push(...partsForAmount);
      }

      return parts.join('， ');
    });
}
