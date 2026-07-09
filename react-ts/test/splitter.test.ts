import { describe, it, expect } from 'vitest';
import { parseBetText, parseStandardBets } from '../src/lib/parser';
import { splitBets } from '../src/lib/splitter';

describe('splitBets', () => {
  it('每个号码总额保持不变', () => {
    const bets = parseStandardBets(parseBetText('08.01*200'));
    const result = splitBets(bets, 5, 10, 10);
    const totals: Record<string, number> = {};
    for (const line of result) {
      for (const item of line.split(',')) {
        const [code, amount] = item.split('*');
        totals[code] = (totals[code] || 0) + parseInt(amount, 10);
      }
    }
    expect(totals['08']).toBe(200);
    expect(totals['01']).toBe(200);
  });

  it('每组金额满足步长约束', () => {
    const bets = parseStandardBets(parseBetText('08*200'));
    const result = splitBets(bets, 5, 10, 10);
    for (const line of result) {
      for (const item of line.split(',')) {
        const [, amount] = item.split('*');
        const val = parseInt(amount, 10);
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val % 10).toBe(0);
      }
    }
  });
});
