import { Calculator, Eraser } from 'lucide-react';

interface WelcomePageProps {
  onNavigate: (path: '/chaidan' | '/shuzi') => void;
}

export function WelcomePage({ onNavigate }: WelcomePageProps) {
  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-gradient md:text-4xl">
          欢迎使用 sixhe
        </h2>
        <p className="mb-8 text-sm text-slate-500 md:text-base">
          智能注单解析与拆单工具，选择一个功能开始使用
        </p>
      </div>

      <div className="grid w-full gap-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigate('/chaidan')}
          className="press-scale focus-ring flex flex-col items-center gap-4 rounded-2xl glass-strong p-6 card-shadow transition hover:brightness-[1.02]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl accent-gradient accent-glow text-white shadow-md">
            <Calculator className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">拆单</h3>
            <p className="text-xs text-slate-500">解析注单并自动拆分为多组</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/shuzi')}
          className="press-scale focus-ring flex flex-col items-center gap-4 rounded-2xl glass-strong p-6 card-shadow transition hover:brightness-[1.02]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl accent-gradient accent-glow text-white shadow-md">
            <Eraser className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">小数字</h3>
            <p className="text-xs text-slate-500">按指定数字消除原文本中的匹配项</p>
          </div>
        </button>
      </div>
    </main>
  );
}
