import { describe, it, expect } from 'vitest';
import { parseBetText, parseStandardBets } from '../src/lib/parser';
import { splitBets } from '../src/lib/splitter';

function parseSplitLine(line: string): Array<{ code: string; amount: number }> {
  const items: Array<{ code: string; amount: number }> = [];
  for (const item of line.split('， ')) {
    const match = item.match(/^(.+?)各(\d+)$/);
    if (!match) continue;
    const codePart = match[1];
    const amount = parseInt(match[2], 10);
    for (const code of codePart.split('-')) {
      items.push({ code, amount });
    }
  }
  return items;
}

describe('splitBets', () => {
  it('每个号码总额保持不变', () => {
    const bets = parseStandardBets(parseBetText('08.01*200'));
    const result = splitBets(bets, 5, 10, 10);
    const totals: Record<string, number> = {};
    for (const line of result) {
      for (const { code, amount } of parseSplitLine(line)) {
        totals[code] = (totals[code] || 0) + amount;
      }
    }
    expect(totals['08']).toBe(200);
    expect(totals['01']).toBe(200);
  });

  it('每组金额满足步长约束', () => {
    const bets = parseStandardBets(parseBetText('08*200'));
    const result = splitBets(bets, 5, 10, 10);
    for (const line of result) {
      for (const { amount } of parseSplitLine(line)) {
        expect(amount).toBeGreaterThanOrEqual(10);
        expect(amount % 10).toBe(0);
      }
    }
  });

  it('重复号码金额会累加', () => {
    const text = '01.20.20.32.44x100';
    const bets = parseStandardBets(parseBetText(text));
    expect(bets.filter((b) => b.code === '20').length).toBe(2);

    const result = splitBets(bets, 5, 10, 10, 1);

    const totals: Record<string, number> = {};
    for (const line of result) {
      for (const { code, amount } of parseSplitLine(line)) {
        totals[code] = (totals[code] || 0) + amount;
      }
    }
    expect(totals['01']).toBe(100);
    expect(totals['20']).toBe(200);
    expect(totals['32']).toBe(100);
    expect(totals['44']).toBe(100);
  });
});
