import { useMemo, useState } from 'react';
import { Check, Copy, Eraser } from 'lucide-react';
import { useClipboard } from '../hooks/useClipboard';

export function XiaoShuzi() {
  const [removeInput, setRemoveInput] = useState('');
  const [source, setSource] = useState('');
  const [copied, setCopied] = useState(false);
  const { copy } = useClipboard();

  const output = useMemo(() => {
    const trimmed = removeInput.trim();
    if (!trimmed) return source;

    const parts = trimmed
      .split(/,|，|\./)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parts.length === 0) return source;

    const escaped = parts.map((s) =>
      s.replace(/([|\\*.+?^$[\](){}/])/g, '\\$1')
    );
    const pattern = `(?<!\\d)(${escaped.join('|')})(?!\\d)\\.?`;
    return source.replace(new RegExp(pattern, 'gu'), '');
  }, [removeInput, source]);

  const handleCopy = async () => {
    const ok = await copy(output);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col">
      <div className="flex h-full flex-col rounded-2xl glass-strong p-4 card-shadow md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl accent-gradient accent-glow text-white shadow-sm">
            <Eraser className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-800">小数字</h2>
            <p className="text-xs text-slate-500">按指定数字消除原文本中的匹配项</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="remove-numbers"
              className="text-sm font-medium text-slate-700"
            >
              消除数字
            </label>
            <input
              id="remove-numbers"
              type="text"
              value={removeInput}
              onChange={(e) => setRemoveInput(e.target.value)}
              placeholder="例如：1,2,3（支持逗号或点分隔）"
              className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-emerald-400/60 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="source-text"
              className="text-sm font-medium text-slate-700"
            >
              原文本
            </label>
            <textarea
              id="source-text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="输入原始文本"
              className="focus-ring min-h-[140px] w-full resize-none rounded-xl border border-slate-200 bg-white/80 p-3 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-400/60 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="press-scale focus-ring flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl accent-gradient px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105"
          >
            {copied ? (
              <Check className="h-5 w-5" strokeWidth={2.5} />
            ) : (
              <Copy className="h-5 w-5" strokeWidth={2.5} />
            )}
            {copied ? '已复制' : '复制结果'}
          </button>

          <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
            <label
              htmlFor="result-text"
              className="text-sm font-medium text-slate-700"
            >
              结果
            </label>
            <textarea
              id="result-text"
              readOnly
              value={output}
              placeholder="处理后的文本会显示在这里"
              className="focus-ring min-h-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-base leading-relaxed text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
