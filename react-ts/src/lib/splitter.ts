import type { Bet } from './parser';

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

export function splitBets(
  bets: Bet[],
  groups: number,
  minAmount: number,
  step = 10
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

  return groupBets
    .filter((g) => g.length > 0)
    .map((g) =>
      g
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((b) => `${b.code}*${b.amount}`)
        .join(',')
    );
}
