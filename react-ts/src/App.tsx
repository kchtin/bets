import { useState, useEffect, useCallback } from 'react';
import { parseBetText, parseStandardBets, formatParsedBets, type Bet } from './lib/parser';
import { splitBets } from './lib/splitter';
import { useClipboard } from './hooks/useClipboard';
import { useLog } from './hooks/useLog';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClipboardPaste, Copy, Calculator, Trash2 } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">sixhe</h1>
            <p className="text-sm text-slate-500">注单解析与拆单工具</p>
          </div>
          <Badge variant="secondary">React + TS</Badge>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardPaste className="h-4 w-4" />
                  输入注单
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="粘贴或输入下注文案，例如：牛羊个200"
                  rows={4}
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handlePaste} size="sm">
                    <ClipboardPaste className="mr-1 h-4 w-4" />
                    粘贴
                  </Button>
                  <Button variant="outline" onClick={handleClear} size="sm">
                    <Trash2 className="mr-1 h-4 w-4" />
                    清空
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    解析结果
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleCopyParsed}>
                    复制
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  readOnly
                  value={parsedText}
                  placeholder="解析后的注单会显示在这里"
                  rows={6}
                  className="font-mono text-sm cursor-pointer"
                  onClick={handleCopyParsed}
                  title="点击复制"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    拆单结果
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleCopySplit}>
                    复制
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  readOnly
                  value={splitText}
                  placeholder="拆单结果会显示在这里"
                  rows={8}
                  className="font-mono text-sm cursor-pointer"
                  onClick={handleCopySplit}
                  title="点击复制"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="groups">组数</Label>
                  <Input
                    id="groups"
                    type="number"
                    min={1}
                    value={groups}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroups(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minAmount">最低金额</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    min={0}
                    value={minAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinAmount(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>倍数步长</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={step === 5 ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => handleStepChange(5)}
                    >
                      5x
                    </Button>
                    <Button
                      variant={step === 10 ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => handleStepChange(10)}
                    >
                      10x
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">日志</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={containerRef}
                  className="h-48 overflow-y-auto rounded-md border bg-muted/50 p-3 text-xs"
                >
                  {logs.length === 0 ? (
                    <span className="text-muted-foreground">暂无日志</span>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className={`mb-1 border-b border-border/50 pb-1 last:border-0 ${
                          log.type === 'error'
                            ? 'text-red-600'
                            : log.type === 'success'
                            ? 'text-green-600'
                            : 'text-slate-600'
                        }`}
                      >
                        <span className="opacity-60">[{log.time}]</span> {log.message}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-6" />

        <footer className="text-center text-xs text-slate-400">
          sixhe © 2026 · React + TypeScript + Tauri
        </footer>
      </div>
    </div>
  );
}

export default App;
