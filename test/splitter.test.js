import { describe, it, expect } from 'vitest';
import { splitBets } from '../src/splitter.js';

function parseResultLine(line) {
  return line.split(',').map((item) => {
    const [code, amount] = item.split('*');
    return { code, amount: parseInt(amount, 10) };
  });
}

function collectTotalByCode(lines) {
  const map = {};
  for (const line of lines) {
    for (const { code, amount } of parseResultLine(line)) {
      map[code] = (map[code] || 0) + amount;
    }
  }
  return map;
}

describe('splitBets', () => {
  it('每个号码的总额保持不变', () => {
    const bets = [
      { code: '08', amount: 200 },
      { code: '01', amount: 200 },
      { code: '04', amount: 200 },
    ];
    const result = splitBets(bets, 5, 20, 10);
    const totals = collectTotalByCode(result);
    expect(totals['08']).toBe(200);
    expect(totals['01']).toBe(200);
    expect(totals['04']).toBe(200);
  });

  it('每组中每个号码的金额 >= minAmount 且为 minAmount + n*step', () => {
    const bets = [
      { code: '08', amount: 200 },
      { code: '01', amount: 200 },
    ];
    const minAmount = 25;
    const step = 10;
    const result = splitBets(bets, 5, minAmount, step);
    for (const line of result) {
      for (const { amount } of parseResultLine(line)) {
        expect(amount).toBeGreaterThanOrEqual(minAmount);
        expect((amount - minAmount) % step).toBe(0);
      }
    }
  });

  it('step=5 时金额增量为 5', () => {
    const bets = [{ code: '08', amount: 200 }];
    const minAmount = 10;
    const step = 5;
    const result = splitBets(bets, 1, minAmount, step);
    for (const { amount } of parseResultLine(result[0])) {
      expect(amount).toBeGreaterThanOrEqual(minAmount);
      expect((amount - minAmount) % step).toBe(0);
    }
  });

  it('step=10 时金额增量为 10', () => {
    const bets = [{ code: '08', amount: 200 }];
    const minAmount = 10;
    const step = 10;
    const result = splitBets(bets, 1, minAmount, step);
    for (const { amount } of parseResultLine(result[0])) {
      expect(amount).toBeGreaterThanOrEqual(minAmount);
      expect(amount % 10).toBe(0);
    }
  });

  it('空注单报错', () => {
    expect(() => splitBets([], 2, 10)).toThrow('拆单失败：注单为空');
  });

  it('组数非法报错', () => {
    expect(() => splitBets([{ code: '10', amount: 10 }], 0, 10)).toThrow('拆单失败：组数必须为正整数');
  });

  it('金额不是 step 的倍数时报错', () => {
    const bets = [{ code: '10', amount: 205 }];
    expect(() => splitBets(bets, 2, 10, 10)).toThrow('不是 10 的倍数');
  });

  it('金额不足 minAmount 时整份放入一组', () => {
    const bets = [{ code: '10', amount: 8 }];
    const result = splitBets(bets, 3, 10, 1);
    const totals = collectTotalByCode(result);
    expect(totals['10']).toBe(8);
  });
});
