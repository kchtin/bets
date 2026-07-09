/**
 * 2026 丙午年生肖号码映射（以当年生肖“马”起头）
 * 每个生肖对应 4~5 个号码，覆盖 01~49。
 */
export const ZODIAC_MAP_2026 = {
  马: ['01', '13', '25', '37', '49'],
  羊: ['02', '14', '26', '38'],
  猴: ['03', '15', '27', '39'],
  鸡: ['04', '16', '28', '40'],
  狗: ['05', '17', '29', '41'],
  猪: ['06', '18', '30', '42'],
  鼠: ['07', '19', '31', '43'],
  牛: ['08', '20', '32', '44'],
  虎: ['09', '21', '33', '45'],
  兔: ['10', '22', '34', '46'],
  龙: ['11', '23', '35', '47'],
  蛇: ['12', '24', '36', '48'],
};

const ALL_ZODIAC_CODES = Object.values(ZODIAC_MAP_2026).flat();

/**
 * 判断一段文本是否为生肖序列（纯中文字符）
 */
function isZodiacToken(token) {
  return /^[鼠牛虎兔龙蛇马羊猴鸡狗猪]+$/.test(token);
}

/**
 * 将生肖序列拆分为单个生肖字符数组
 */
function splitZodiacTokens(token) {
  return token.split('');
}

/**
 * 解析单个下注片段，例如 "10,20,30*10" 或 "鼠牛虎兔*5"
 * @param {string} segment
 * @returns {string[]} 形如 ['10*10', '20*10', '30*10'] 的数组
 */
function parseSegment(segment) {
  const trimmed = segment.trim();
  if (!trimmed) return [];

  // 匹配末尾金额：支持 *10 / 个10 / 各10
  const amountMatch = trimmed.match(/([*个各])(\d+)$/);
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

  // 按分隔符拆分号码
  const rawCodes = codesPart.split(/[,，、/.]+/).filter(Boolean);
  if (rawCodes.length === 0) {
    throw new Error('解析失败：未识别号码');
  }

  const results = [];
  for (const raw of rawCodes) {
    const code = raw.trim();
    if (!code) continue;

    if (isZodiacToken(code)) {
      // 生肖序列展开：鼠牛 -> 鼠, 牛
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
      // 数字号码，统一格式化为两位
      const normalized = code.padStart(2, '0');
      results.push(`${normalized}*${amount}`);
    } else {
      throw new Error(`解析失败：无法识别的号码（${code}）`);
    }
  }

  return results;
}

/**
 * 将原始下注文本解析为标准格式
 * 多段之间可用换行或空格分隔
 * @param {string} text
 * @returns {string} 形如 "10*10,20*10,30*10" 的标准格式
 */
export function parseBetText(text) {
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

  const results = [];
  for (const segment of segments) {
    results.push(...parseSegment(segment));
  }

  if (results.length === 0) {
    throw new Error('解析失败：未识别任何注单');
  }

  return results.join(',');
}

/**
 * 将标准格式字符串解析为结构化注单数组
 * @param {string} text
 * @returns {{code: string, amount: number}[]}
 */
export function parseStandardBets(text) {
  if (!text || typeof text !== 'string') return [];

  return text.split(',').map((item) => {
    const [code, amount] = item.split('*');
    return { code, amount: parseInt(amount, 10) || 0 };
  });
}

/**
 * 验证号码是否属于当前生肖映射表
 */
export function isValidZodiacCode(code) {
  return ALL_ZODIAC_CODES.includes(code);
}

/**
 * 将标准注单格式化为对齐的多列文本
 * @param {{code: string, amount: number}[]} bets
 * @param {number} columns 列数，默认 5
 * @returns {string}
 */
export function formatParsedBets(bets, columns = 5) {
  if (!bets || bets.length === 0) return '';

  const items = bets.map((b) => `${b.code}*${b.amount}`);
  const maxLen = Math.max(...items.map((s) => s.length));
  const colWidth = maxLen + 3; // 列间距

  const rows = [];
  for (let i = 0; i < items.length; i += columns) {
    const rowItems = items.slice(i, i + columns);
    const padded = rowItems.map((s) => s.padEnd(colWidth, ' '));
    rows.push(padded.join('').trimEnd());
  }

  return rows.join('\n');
}
