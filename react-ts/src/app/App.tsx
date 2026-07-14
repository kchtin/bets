import { useState } from 'react';
import { SixhePage } from '@/pages/SixhePage';
import { XiaoShuziPage } from '@/pages/XiaoShuziPage';
import logoUrl from '@/assets/logo.png';

type Page = 'sixhe' | 'xiaoshuzi';

function App() {
  const [page, setPage] = useState<Page>('sixhe');

  return (
    <div className="relative flex h-screen flex-col overflow-x-hidden p-4 md:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[15%] -top-[10%] h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-emerald-300/10 blur-[100px]" />
      </div>

      <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
        <header className="mb-6 flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md press-scale focus-ring">
              <img src={logoUrl} alt="sixhe" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient md:text-3xl">sixhe</h1>
              <p className="text-xs text-slate-500">智能注单解析与拆单工具</p>
            </div>
          </div>

          <nav className="flex items-center rounded-xl border border-slate-200 bg-white/70 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setPage('sixhe')}
              className={`press-scale focus-ring rounded-lg px-3 py-2 text-sm font-semibold transition md:px-4 ${
                page === 'sixhe'
                  ? 'accent-gradient text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              拆单
            </button>
            <button
              type="button"
              onClick={() => setPage('xiaoshuzi')}
              className={`press-scale focus-ring rounded-lg px-3 py-2 text-sm font-semibold transition md:px-4 ${
                page === 'xiaoshuzi'
                  ? 'accent-gradient text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              小数字
            </button>
          </nav>
        </header>

        {page === 'sixhe' ? <SixhePage /> : <XiaoShuziPage />}
      </div>
    </div>
  );
}

export default App;
