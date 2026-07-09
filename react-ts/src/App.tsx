import { useState, useEffect, useCallback } from 'react';
import { parseBetText, parseStandardBets, formatParsedBets, type Bet } from './lib/parser';
import { splitBets } from './lib/splitter';
import { useClipboard } from './hooks/useClipboard';
import { useLog } from './hooks/useLog';
import { ClipboardPaste, Copy, Calculator, Trash2, Sparkles, Activity } from 'lucide-react';

type Step = 5 | 10;

function App() {
  const [input, setInput] = useState('');
  const [parsedText, setParsedText] = useState('');
  const [splitText, setSplitText] = useState('');
  const [bets, setBets] = useState<Bet[]>([]);
  const [groups, setGroups] = useState(5);
  const [minAmount, setMinAmount] = useState(10);
  const [step, setStep] = useState<Step>(10);

  const { copy, paste } = useClipboard();
  const { logs, append, containerRef } = useLog();

  const doParse = useCallback((text: string) => {
    if (!text.trim()) {
      setParsedText('');
      setBets([]);
      setSplitText('');
      return;
    }
    try {
      const standard = parseBetText(text);
      const parsed = parseStandardBets(standard);
      setBets(parsed);
      setParsedText(formatParsedBets(parsed, 5));
      append(`已解析 ${parsed.length} 注`, 'success');
    } catch (err) {
      setParsedText('');
      setBets([]);
      setSplitText('');
      append(err instanceof Error ? err.message : '解析失败', 'error');
    }
  }, [append]);

  const doSplit = useCallback((currentBets: Bet[], currentGroups: number, currentMin: number, currentStep: number) => {
    if (currentBets.length === 0) {
      setSplitText('');
      return;
    }
    try {
      const lines = splitBets(currentBets, currentGroups, currentMin, currentStep);
      setSplitText(lines.join('\n'));
      append('已自动拆单', 'info');
    } catch (err) {
      setSplitText('');
      append(err instanceof Error ? err.message : '拆单失败', 'error');
    }
  }, [append]);

  useEffect(() => {
    doSplit(bets, groups, minAmount, step);
  }, [bets, groups, minAmount, step, doSplit]);

  const handleInputChange = (text: string) => {
    setInput(text);
    doParse(text);
  };

  const handlePaste = async () => {
    const text = await paste();
    if (text) {
      handleInputChange(text);
    } else {
      append('粘贴失败', 'error');
    }
  };

  const handleManualSplit = () => {
    doSplit(bets, groups, minAmount, step);
    copy(splitText).then((ok) => {
      append(ok ? '拆单结果已复制' : '复制失败', ok ? 'success' : 'error');
    });
  };

  const handleCopyParsed = async () => {
    const ok = await copy(parsedText);
    append(ok ? '解析结果已复制' : '复制失败', ok ? 'success' : 'error');
  };

  const handleCopySplit = async () => {
    const ok = await copy(splitText);
    append(ok ? '拆单结果已复制' : '复制失败', ok ? 'success' : 'error');
  };

  const handleStepChange = (newStep: Step) => {
    if (newStep === step) return;
    setStep(newStep);
    append(`拆单步长 ${newStep}`, 'info');
  };

  const handleClear = () => {
    setInput('');
    setParsedText('');
    setSplitText('');
    setBets([]);
    append('已清空', 'info');
  };

  const SectionHeader = ({
    icon: Icon,
    title,
    action,
  }: {
    icon: React.ElementType;
    title: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg accent-gradient accent-glow text-white shadow-sm">
          <Icon className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <h2 className="text-sm font-semibold tracking-wide text-slate-800">{title}</h2>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="press-scale focus-ring flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
        >
          <Copy className="h-3 w-3" />
          {action.label}
        </button>
      )}
    </div>
  );

  return (
    <div className="relative flex h-screen flex-col overflow-x-hidden p-4 md:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[15%] -top-[10%] h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-emerald-300/10 blur-[100px]" />
      </div>

      <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
        <header className="mb-6 flex shrink-0 items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl accent-gradient accent-glow press-scale focus-ring shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient md:text-3xl">sixhe</h1>
            <p className="text-xs text-slate-500">智能注单解析与拆单工具</p>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
          <section className="flex min-h-0 flex-col gap-5 lg:col-span-8">
            <article className="ambient-light flex min-h-0 flex-[1.2] flex-col rounded-2xl glass-strong p-4 card-shadow md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg accent-gradient accent-glow text-white shadow-sm">
                    <ClipboardPaste className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-sm font-semibold tracking-wide text-slate-800">输入注单</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePaste}
                    className="press-scale focus-ring flex min-h-[36px] items-center gap-1.5 rounded-lg accent-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/15 transition hover:brightness-105"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    粘贴
                  </button>
                  <button
                    onClick={handleClear}
                    className="press-scale focus-ring flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    清空
                  </button>
                </div>
              </div>
              <textarea
                id="bet-input"
                aria-label="下注文案输入"
                placeholder="粘贴或输入下注文案，例如：牛羊个200"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                className="focus-ring min-h-0 flex-1 resize-none rounded-xl border border-slate-200 bg-white/80 p-3 font-mono text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-emerald-400/60 focus:bg-white focus:outline-none"
              />
            </article>

            <article className="flex min-h-0 flex-[2] flex-col rounded-2xl glass-strong p-4 card-shadow md:p-5">
              <SectionHeader
                icon={Copy}
                title="解析结果"
                action={{ label: '复制', onClick: handleCopyParsed }}
              />
              <textarea
                readOnly
                value={parsedText}
                placeholder="解析后的注单会显示在这里"
                className="focus-ring min-h-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/80 p-3 font-mono text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </article>

            <article className="flex min-h-0 flex-[3] flex-col rounded-2xl glass-strong p-4 card-shadow md:p-5">
              <SectionHeader
                icon={Calculator}
                title="拆单结果"
                action={{ label: '复制', onClick: handleCopySplit }}
              />
              <textarea
                readOnly
                value={splitText}
                placeholder="拆单结果会显示在这里"
                className="focus-ring min-h-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50/80 p-3 font-mono text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </article>
          </section>

          <aside className="flex min-h-0 flex-col gap-5 lg:col-span-4">
            <article className="rounded-2xl glass-strong p-4 card-shadow md:p-5">
              <SectionHeader icon={Calculator} title="设置" />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="groups" className="text-xs font-medium text-slate-700">
                    组数
                  </label>
                  <input
                    id="groups"
                    type="number"
                    min={1}
                    value={groups}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroups(parseInt(e.target.value) || 1)}
                    className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-800 focus:border-emerald-400/60 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="minAmount" className="text-xs font-medium text-slate-700">
                    最低金额
                  </label>
                  <input
                    id="minAmount"
                    type="number"
                    min={0}
                    value={minAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinAmount(parseInt(e.target.value) || 0)}
                    className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm text-slate-800 focus:border-emerald-400/60 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-700">倍数步长</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleStepChange(5)}
                      aria-pressed={step === 5}
                      className={`press-scale focus-ring min-h-[40px] rounded-xl py-2 text-sm font-semibold transition ${
                        step === 5
                          ? 'accent-gradient accent-glow text-white shadow-md'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      5x
                    </button>
                    <button
                      onClick={() => handleStepChange(10)}
                      aria-pressed={step === 10}
                      className={`press-scale focus-ring min-h-[40px] rounded-xl py-2 text-sm font-semibold transition ${
                        step === 10
                          ? 'accent-gradient accent-glow text-white shadow-md'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      10x
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleManualSplit}
                  className="press-scale focus-ring flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl accent-gradient py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105"
                >
                  <Calculator className="h-4 w-4" />
                  拆单
                </button>
              </div>
            </article>

            <article className="flex flex-1 flex-col rounded-2xl glass-strong p-4 card-shadow md:p-5">
              <SectionHeader icon={Activity} title="运行日志" />
              <div
                ref={containerRef}
                role="log"
                aria-live="polite"
                className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs"
              >
                {logs.length === 0 ? (
                  <span className="text-slate-400">暂无日志</span>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`mb-2 border-b border-slate-200/80 pb-2 last:border-0 ${
                        log.type === 'error'
                          ? 'text-red-600'
                          : log.type === 'success'
                          ? 'text-emerald-600'
                          : 'text-slate-500'
                      }`}
                    >
                      <span className="opacity-60">[{log.time}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </article>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;
