import { describe, it, expect } from 'vitest';
import { parseBetText, parseStandardBets, ZODIAC_MAP_2026 } from '../src/parser.js';

describe('parseBetText', () => {
  it('解析数字号码 * 连接符', () => {
    expect(parseBetText('10,20,30*10')).toBe('10*10,20*10,30*10');
  });

  it('解析数字号码 个 连接符', () => {
    expect(parseBetText('10、20、30个10')).toBe('10*10,20*10,30*10');
  });

  it('解析点号分隔符', () => {
    expect(parseBetText('01.13.25.37*10')).toBe('01*10,13*10,25*10,37*10');
  });

  it('解析数字号码 各 连接符', () => {
    expect(parseBetText('10/20/30各10')).toBe('10*10,20*10,30*10');
  });

  it('解析混合中文逗号分隔符', () => {
    expect(parseBetText('10，20*10')).toBe('10*10,20*10');
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

  it('解析单一生肖', () => {
    const result = parseBetText('马*10');
    const expected = ZODIAC_MAP_2026['马'].map((code) => `${code}*10`).join(',');
    expect(result).toBe(expected);
  });

  it('解析多段输入（空格）', () => {
    expect(parseBetText('10*5 20*10')).toBe('10*5,20*10');
  });

  it('解析多段输入（换行）', () => {
    expect(parseBetText('10*5\n20*10')).toBe('10*5,20*10');
  });

  it('数字号码统一为两位', () => {
    expect(parseBetText('1,2,3*10')).toBe('01*10,02*10,03*10');
  });

  it('空输入报错', () => {
    expect(() => parseBetText('')).toThrow('解析失败：输入为空');
    expect(() => parseBetText('   ')).toThrow('解析失败：输入为空');
  });

  it('缺少金额报错', () => {
    expect(() => parseBetText('10,20,30')).toThrow('解析失败：未识别金额');
  });

  it('金额为 0 报错', () => {
    expect(() => parseBetText('10*0')).toThrow('解析失败：金额必须为正整数');
  });

  it('无效号码报错', () => {
    expect(() => parseBetText('abc*10')).toThrow('解析失败：无法识别的号码');
  });

  it('未知生肖报错', () => {
    expect(() => parseBetText('猫*10')).toThrow('解析失败：无法识别的号码');
  });
});

describe('parseStandardBets', () => {
  it('解析标准格式', () => {
    expect(parseStandardBets('10*10,20*5')).toEqual([
      { code: '10', amount: 10 },
      { code: '20', amount: 5 },
    ]);
  });

  it('空字符串返回空数组', () => {
    expect(parseStandardBets('')).toEqual([]);
  });
});
