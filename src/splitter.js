/**
 * 拆单逻辑
 *
 * 核心规则：
 * - 每个号码的原始金额被随机拆分到若干组。
 * - 每组中该号码的金额 >= minAmount。
 * - 每组中该号码的金额 = minAmount + n * step（step 由 5x/10x 决定）。
 * - 一个号码不必出现在所有组中；所有组里该号码的金额之和等于原始金额。
 */

/**
 * 将 value 向上取整到 step 的倍数
 */
function ceilToStep(value, step) {
  return Math.ceil(value / step) * step;
}

/**
 * 随机选择 k 个不重复的组索引
 * @param {number} groups 总组数
 * @param {number} k 要选几个
 */
function pickRandomGroups(groups, k) {
  const indices = Array.from({ length: groups }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, k).sort((a, b) => a - b);
}

/**
 * 将 amount 随机拆分为 k 份，每份 >= minPart 且为 minPart + n*step
 * @param {number} amount
 * @param {number} k
 * @param {number} minPart
 * @param {number} step
 * @returns {number[]}
 */
function randomSplitAmount(amount, k, minPart, step) {
  const base = Array(k).fill(minPart);
  let remaining = amount - k * minPart;
  const units = remaining / step;

  const randomUnits = Array(k).fill(0);
  for (let i = 0; i < units; i++) {
    randomUnits[Math.floor(Math.random() * k)]++;
  }

  return base.map((v, i) => v + randomUnits[i] * step);
}

/**
 * 将单个注单的金额随机分配到若干组
 * @param {{code: string, amount: number}} bet
 * @param {number} groups 总组数
 * @param {number} minAmount 每组最低金额
 * @param {number} step 金额步长
 * @returns {{groupIndex: number, code: string, amount: number}[]}
 */
function distributeSingleBet(bet, groups, minAmount, step) {
  const minPart = minAmount;

  if (bet.amount < minPart) {
    // 连最低金额都满足不了，整份放到随机一组
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

/**
 * 拆单主函数
 * @param {{code: string, amount: number}[]} bets
 * @param {number} groups 目标组数
 * @param {number} minAmount 每组最低金额
 * @param {number} [step] 金额步长（默认 10，对应 10x）
 * @returns {string[]} 每组一行，格式如 "08*30,01*90,..."
 */
export function splitBets(bets, groups, minAmount, step = 10) {
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

  // 初始化各组
  const groupBets = Array.from({ length: groups }, () => []);

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
