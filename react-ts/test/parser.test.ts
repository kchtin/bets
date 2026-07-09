import { describe, it, expect } from 'vitest';
import { parseBetText, parseStandardBets, formatParsedBets, ZODIAC_MAP_2026 } from '../src/lib/parser';

describe('parseBetText', () => {
  it('解析数字号码 * 连接符', () => {
    expect(parseBetText('10,20,30*10')).toBe('10*10,20*10,30*10');
  });

  it('解析生肖号码', () => {
    const result = parseBetText('鼠牛虎兔*5');
    const expected = [
      ...ZODIAC_MAP_2026['鼠'],
      ...ZODIAC_MAP_2026['牛'],
      ...ZODIAC_MAP_2026['虎'],
      ...ZODIAC_MAP_2026['兔'],
    ]
      .map((code) => `${code}*5`)
      .join(',');
    expect(result).toBe(expected);
  });

  it('解析点号分隔符', () => {
    expect(parseBetText('01.13.25.37*10')).toBe('01*10,13*10,25*10,37*10');
  });
});

describe('formatParsedBets', () => {
  it('格式化为多列', () => {
    const bets = parseStandardBets(parseBetText('01.13.25.37.49*10'));
    const formatted = formatParsedBets(bets, 3);
    expect(formatted).toContain('01*10');
    expect(formatted.split('\n').length).toBe(2);
  });
});
