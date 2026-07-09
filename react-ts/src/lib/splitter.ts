import { ZODIAC_MAP_2026, type Bet } from './parser';

interface SubBet {
  groupIndex: number;
  code: string;
  amount: number;
}

function pickRandomGroups(groups: number, k: number): number[] {
  const indices = Array.from({ length: groups }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, k).sort((a, b) => a - b);
}

function randomSplitAmount(amount: number, k: number, minPart: number, step: number): number[] {
  const base = Array(k).fill(minPart);
  const remaining = amount - k * minPart;
  const units = remaining / step;

  const randomUnits = Array(k).fill(0);
  for (let i = 0; i < units; i++) {
    randomUnits[Math.floor(Math.random() * k)]++;
  }

  return base.map((v, i) => v + randomUnits[i] * step);
}

function distributeSingleBet(
  bet: Bet,
  groups: number,
  minAmount: number,
  step: number
): SubBet[] {
  const minPart = minAmount;

  if (bet.amount < minPart) {
    const idx = Math.floor(Math.random() * groups);
    return [{ groupIndex: idx, code: bet.code, amount: bet.amount }];
  }

  const maxGroups = Math.min(groups, Math.floor(bet.amount / minPart));
  const k = Math.floor(Math.random() * maxGroups) + 1;

  const groupIndices = pickRandomGroups(groups, k);
  const amounts = randomSplitAmount(bet.amount, k, minPart, step);

  return groupIndices.map((idx, i) => ({
    groupIndex: idx,
    code: bet.code,
    amount: amounts[i],
  }));
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

export function splitBets(
  bets: Bet[],
  groups: number,
  minAmount: number,
  step = 10,
  minCodes = 1
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

  const groupBets: SubBet[][] = Array.from({ length: groups }, () => []);

  for (const bet of bets) {
    if (bet.amount % step !== 0) {
      throw new Error(
        `拆单失败：号码 ${bet.code} 的金额 ${bet.amount} 不是 ${step} 的倍数，无法按 ${step}x 规则拆分`
      );
    }
    const parts = distributeSingleBet(bet, groups, minAmount, step);
    for (const part of parts) {
      groupBets[part.groupIndex].push(part);
    }
  }

  const balanced = balanceGroups(groupBets, minCodes);

  return balanced
    .filter((g) => g.length > 0)
    .map((g) => {
      const sorted = g.sort((a, b) => a.code.localeCompare(b.code));
      const amountMap = new Map<number, string[]>();
      for (const b of sorted) {
        const list = amountMap.get(b.amount) ?? [];
        list.push(b.code);
        amountMap.set(b.amount, list);
      }

      const parts: string[] = [];
      for (const [amount, codes] of [...amountMap.entries()].sort((a, b) => a[0] - b[0])) {
        const remaining = new Set(codes);
        const zodiacParts: string[] = [];

        for (const [name, zodiacCodes] of Object.entries(ZODIAC_MAP_2026)) {
          if (zodiacCodes.every((c) => remaining.has(c))) {
            zodiacParts.push(`${name}各${amount}`);
            for (const c of zodiacCodes) {
              remaining.delete(c);
            }
          }
        }

        if (remaining.size > 0) {
          zodiacParts.push(`${[...remaining].sort((a, b) => a.localeCompare(b)).join('-')}各${amount}`);
        }

        parts.push(...zodiacParts);
      }

      return parts.join('， ');
    });
}
