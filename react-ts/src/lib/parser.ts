export interface Bet {
  code: string;
  amount: number;
}

/**
 * 2026 丙午年生肖号码映射（当年生肖“马”起头为 01）
 * 来源：2026 马年六合彩生肖号码对照表
 */
export const ZODIAC_MAP_2026: Record<string, string[]> = {
  马: ['01', '13', '25', '37', '49'],
  羊: ['12', '24', '36', '48'],
  猴: ['11', '23', '35', '47'],
  鸡: ['10', '22', '34', '46'],
  狗: ['09', '21', '33', '45'],
  猪: ['08', '20', '32', '44'],
  鼠: ['07', '19', '31', '43'],
  牛: ['06', '18', '30', '42'],
  虎: ['05', '17', '29', '41'],
  兔: ['04', '16', '28', '40'],
  龙: ['03', '15', '27', '39'],
  蛇: ['02', '14', '26', '38'],
};

const ALL_ZODIAC_CODES = Object.values(ZODIAC_MAP_2026).flat();

function isZodiacToken(token: string): boolean {
  return /^[鼠牛虎兔龙蛇马羊猴鸡狗猪]+$/.test(token);
}

function splitZodiacTokens(token: string): string[] {
  return token.split('');
}

function parseSegment(segment: string): string[] {
  const trimmed = segment.trim();
  if (!trimmed) return [];

  const amountMatch = trimmed.match(/([*个各xX])(\d+)$/);
  if (!amountMatch) {
    throw new Error(`解析失败：未识别金额（${trimmed}）`);
  }

  const amount = parseInt(amountMatch[2], 10);
  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error('解析失败：金额必须为正整数');
  }

  const codesPart = trimmed.slice(0, -amountMatch[0].length).trim();
  if (!codesPart) {
    throw new Error('解析失败：号码为空');
  }

  const rawCodes = codesPart.split(/[,，、/.]+/).filter(Boolean);
  if (rawCodes.length === 0) {
    throw new Error('解析失败：未识别号码');
  }

  const results: string[] = [];
  for (const raw of rawCodes) {
    const code = raw.trim();
    if (!code) continue;

    if (isZodiacToken(code)) {
      for (const zodiac of splitZodiacTokens(code)) {
        const numbers = ZODIAC_MAP_2026[zodiac];
        if (!numbers) {
          throw new Error(`解析失败：未知生肖（${zodiac}）`);
        }
        for (const num of numbers) {
          results.push(`${num}*${amount}`);
        }
      }
    } else if (/^\d{1,2}$/.test(code)) {
      const normalized = code.padStart(2, '0');
      results.push(`${normalized}*${amount}`);
    } else {
      throw new Error(`解析失败：无法识别的号码（${code}）`);
    }
  }

  return results;
}

export function parseBetText(text: string): string {
  if (typeof text !== 'string') {
    throw new Error('解析失败：输入必须是字符串');
  }

  const segments = text
    .split(/[\n\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    throw new Error('解析失败：输入为空');
  }

  const results: string[] = [];
  for (const segment of segments) {
    results.push(...parseSegment(segment));
  }

  if (results.length === 0) {
    throw new Error('解析失败：未识别任何注单');
  }

  return results.join(',');
}

export function parseStandardBets(text: string): Bet[] {
  if (!text || typeof text !== 'string') return [];

  return text.split(',').map((item) => {
    const [code, amount] = item.split('*');
    return { code, amount: parseInt(amount, 10) || 0 };
  });
}

export function formatParsedBets(bets: Bet[], columns = 5): string {
  if (!bets || bets.length === 0) return '';

  const merged = new Map<string, number>();
  for (const b of bets) {
    merged.set(b.code, (merged.get(b.code) ?? 0) + b.amount);
  }

  const items = [...merged.entries()].map(([code, amount]) => `${code}*${amount}`);
  const maxLen = Math.max(...items.map((s) => s.length));
  const colWidth = maxLen + 3;

  const rows: string[] = [];
  for (let i = 0; i < items.length; i += columns) {
    const rowItems = items.slice(i, i + columns);
    const padded = rowItems.map((s) => s.padEnd(colWidth, ' '));
    rows.push(padded.join('').trimEnd());
  }

  return rows.join('\n');
}

export function isValidZodiacCode(code: string): boolean {
  return ALL_ZODIAC_CODES.includes(code);
}
