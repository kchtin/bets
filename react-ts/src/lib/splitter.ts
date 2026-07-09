import { ZODIAC_MAP_2026, type Bet } from './parser';

interface SubBet {
  groupIndex: number;
  code: string;
  amount: number;
}

function splitAmount(total: number, k: number, step: number): number[] {
  // 把 total 尽量平均拆成 k 份，每份是 step 的倍数
  const base = Math.floor(total / k / step) * step;
  const remainder = total - base * k;
  const result = Array(k).fill(base);
  let left = remainder;
  for (let i = 0; i < k && left > 0; i++) {
    const add = Math.min(left, step);
    result[i] += add;
    left -= add;
  }
  return result;
}

function computeParts(total: number, groups: number, minAmount: number, step: number): number {
  // 默认把每个 code 拆成 2 份（如果组数允许），并保证每份不小于 minAmount 且不小于 step
  let k = Math.min(groups, 2);
  while (k > 1) {
    const base = Math.floor(total / k / step) * step;
    if (base < minAmount) {
      k--;
    } else {
      break;
    }
  }
  return k;
}

function distributeBets(
  bets: Bet[],
  groups: number,
  minAmount: number,
  step: number
): SubBet[][] {
  const groupBets: SubBet[][] = Array.from({ length: groups }, () => []);
  const groupShareCounts: number[] = Array(groups).fill(0);
  const merged = new Map<string, number>();
  for (const b of bets) {
    merged.set(b.code, (merged.get(b.code) ?? 0) + b.amount);
  }

  // 金额不足 minAmount 的 code 整体放入当前小项最少的一组
  for (const [code, amount] of merged.entries()) {
    if (amount > 0 && amount < minAmount) {
      const idx = groupShareCounts.indexOf(Math.min(...groupShareCounts));
      groupBets[idx].push({ groupIndex: idx, code, amount });
      groupShareCounts[idx]++;
      merged.set(code, 0);
    }
  }

  // 构建所有待分配的小项（每个 code 拆成 k 份）
  const shares: { code: string; amount: number }[] = [];
  for (const [code, total] of merged.entries()) {
    if (total <= 0) continue;
    const k = computeParts(total, groups, minAmount, step);
    for (const amount of splitAmount(total, k, step)) {
      shares.push({ code, amount });
    }
  }

  // 随机打乱，让不同 code 的组合更自然
  shares.sort(() => Math.random() - 0.5);

  for (const share of shares) {
    const { code, amount } = share;

    // 优先放到还没有此 code 的组，避免同一组内同 code 多次出现
    const unusedGroups: number[] = [];
    for (let i = 0; i < groups; i++) {
      if (!groupBets[i].some((b) => b.code === code)) unusedGroups.push(i);
    }

    let candidates = unusedGroups;
    if (candidates.length === 0) {
      const codeCounts = groupBets.map((g, i) => ({
        i,
        count: g.filter((b) => b.code === code).length,
      }));
      const minCount = Math.min(...codeCounts.map((c) => c.count));
      candidates = codeCounts.filter((c) => c.count === minCount).map((c) => c.i);
    }

    // 在候选组里，优先放到当前小项最少的组，保证各组份数尽量平均
    const groupIndex = candidates.reduce((best, i) =>
      groupShareCounts[i] < groupShareCounts[best] ? i : best, candidates[0]);

    groupBets[groupIndex].push({ groupIndex, code, amount });
    groupShareCounts[groupIndex]++;
  }

  return groupBets;
}

function getGroupCodeSet(group: SubBet[]): Set<string> {
  return new Set(group.map((b) => b.code));
}

function balanceGroups(groupBets: SubBet[][], minCodes: number): SubBet[][] {
  if (minCodes <= 1) return groupBets.map((g) => [...g]);

  const balanced = groupBets.map((g) => [...g]);

  while (true) {
    const counts = balanced.map((g) => getGroupCodeSet(g).size);
    const needyIdx = counts.findIndex((c) => c < minCodes);
    if (needyIdx === -1) break;

    const targetCodes = getGroupCodeSet(balanced[needyIdx]);
    const sourceCandidates = balanced
      .map((_, idx) => ({ idx, count: counts[idx] }))
      .filter(({ idx, count }) => idx !== needyIdx && count > minCodes)
      .sort((a, b) => b.count - a.count);

    let moved = false;
    for (const source of sourceCandidates) {
      const sourceCodes = getGroupCodeSet(balanced[source.idx]);
      const movableCode = [...sourceCodes].find((c) => !targetCodes.has(c));
      if (!movableCode) continue;

      const sourceGroup = balanced[source.idx];
      const betIndex = sourceGroup.findIndex((b) => b.code === movableCode);
      if (betIndex === -1) continue;

      const [bet] = sourceGroup.splice(betIndex, 1);
      balanced[needyIdx].push({ ...bet, groupIndex: needyIdx });
      moved = true;
      break;
    }

    if (!moved) break;
  }

  return balanced;
}

function getKindCount(group: SubBet[]): number {
  return new Set(group.map((b) => b.amount)).size;
}

function constrainKinds(
  groupBets: SubBet[][],
  maxKinds: number,
  minCodes: number
): SubBet[][] {
  if (maxKinds <= 0) return groupBets.map((g) => [...g]);

  const constrained = groupBets.map((g) => [...g]);

  while (true) {
    const overIdx = constrained.findIndex((g) => getKindCount(g) > maxKinds);
    if (overIdx === -1) break;

    const overGroup = constrained[overIdx];
    let moved = false;

    for (let i = 0; i < overGroup.length; i++) {
      const bet = overGroup[i];
      if (overGroup.length - 1 < minCodes) continue;

      for (let targetIdx = 0; targetIdx < constrained.length; targetIdx++) {
        if (targetIdx === overIdx) continue;
        const target = constrained[targetIdx];

        const existing = target.find((b) => b.code === bet.code);
        if (existing) {
          const newAmount = existing.amount + bet.amount;
          const newKinds = new Set(
            target.map((b) => (b.code === bet.code ? newAmount : b.amount))
          ).size;
          if (newKinds > maxKinds) continue;

          overGroup.splice(i, 1);
          existing.amount = newAmount;
          moved = true;
          break;
        } else {
          const newKinds = new Set([...target.map((b) => b.amount), bet.amount]).size;
          if (newKinds > maxKinds) continue;

          overGroup.splice(i, 1);
          target.push({ ...bet, groupIndex: targetIdx });
          moved = true;
          break;
        }
      }
      if (moved) break;
    }

    if (!moved) {
      // 金额重分配：把某个 code 的金额改为组内已有的另一个金额，
      // 差额移到另一个已有该 code 的组，从而减少本组金额种类数。
      for (let i = 0; i < overGroup.length; i++) {
        const bet = overGroup[i];
        const otherAmounts = [
          ...new Set(overGroup.filter((b) => b !== bet).map((b) => b.amount)),
        ];

        for (const targetAmount of otherAmounts) {
          if (bet.amount <= targetAmount) continue;
          const diff = bet.amount - targetAmount;

          for (let targetIdx = 0; targetIdx < constrained.length; targetIdx++) {
            if (targetIdx === overIdx) continue;
            const target = constrained[targetIdx];
            const existing = target.find((b) => b.code === bet.code);
            if (!existing) continue;

            const newAmount = existing.amount + diff;
            const newKinds = new Set(
              target.map((b) => (b.code === bet.code ? newAmount : b.amount))
            ).size;
            if (newKinds > maxKinds) continue;

            existing.amount = newAmount;
            bet.amount = targetAmount;
            moved = true;
            break;
          }
          if (moved) break;
        }
        if (moved) break;
      }
    }

    if (!moved) break;
  }

  return constrained;
}

export function splitBets(
  bets: Bet[],
  groups: number,
  minAmount: number,
  step = 10,
  minCodes = 1,
  maxKinds = 0
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
  if (!Number.isInteger(minCodes) || minCodes < 1) {
    throw new Error('拆单失败：每组最少号码数量必须为正整数');
  }
  if (!Number.isInteger(maxKinds) || maxKinds < 0) {
    throw new Error('拆单失败：每组最多小项数必须为非负整数');
  }

  const groupBets = distributeBets(bets, groups, minAmount, step);
  const balanced = balanceGroups(groupBets, minCodes);
  const constrained = constrainKinds(balanced, maxKinds, minCodes);

  return constrained
    .filter((g) => g.length > 0)
    .map((g) => {
      const isZodiacName = (code: string) => code in ZODIAC_MAP_2026;
      const sorted = g.sort((a, b) => {
        const az = isZodiacName(a.code) ? 0 : 1;
        const bz = isZodiacName(b.code) ? 0 : 1;
        if (az !== bz) return az - bz;
        return a.code.localeCompare(b.code);
      });
      const amountMap = new Map<number, string[]>();
      for (const b of sorted) {
        const list = amountMap.get(b.amount) ?? [];
        list.push(b.code);
        amountMap.set(b.amount, list);
      }

      const parts: string[] = [];
      for (const [amount, codes] of [...amountMap.entries()].sort((a, b) => a[0] - b[0])) {
        const remaining = [...codes];
        const zodiacNames: string[] = [];

        for (const [name, zodiacCodes] of Object.entries(ZODIAC_MAP_2026)) {
          const set = new Set(remaining);
          if (zodiacCodes.every((c) => set.has(c))) {
            zodiacNames.push(name);
            for (const c of zodiacCodes) {
              const idx = remaining.indexOf(c);
              if (idx !== -1) remaining.splice(idx, 1);
            }
          }
        }

        const partsForAmount: string[] = [];
        const allCodes = [
          ...zodiacNames,
          ...remaining.sort((a, b) => a.localeCompare(b)),
        ];
        if (allCodes.length > 0) {
          partsForAmount.push(`${allCodes.join('-')}各${amount}`);
        }
        parts.push(...partsForAmount);
      }

      return parts.join('， ');
    });
}
