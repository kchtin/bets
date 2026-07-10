import { describe, it, expect } from 'vitest';
import { parseBetText, parseStandardBets } from '../src/lib/parser';
import { splitBets } from '../src/lib/splitter';

function parseSegment(item: string): { codePart: string; amount: number } | null {
  // 处理 "各号X" / "各位X"
  const prefixMatch = item.match(/^(.+?)各号(\d+)$/) || item.match(/^(.+?)各位(\d+)$/);
  if (prefixMatch) {
    return { codePart: prefixMatch[1], amount: parseInt(prefixMatch[2], 10) };
  }
  // 处理 "各X<单位>"
  const suffixMatch = item.match(/^(.+?)各(\d+)(米|元|块|闷)$/);
  if (suffixMatch) {
    return { codePart: suffixMatch[1], amount: parseInt(suffixMatch[2], 10) };
  }
  return null;
}

function parseSplitLine(line: string): Array<{ code: string; amount: number }> {
  const items: Array<{ code: string; amount: number }> = [];
  for (const item of line.split('， ')) {
    const parsed = parseSegment(item);
    if (!parsed) continue;
    const { codePart, amount } = parsed;
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
