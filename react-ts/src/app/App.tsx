import { useState, useEffect } from 'react';
import { SixhePage } from '@/pages/SixhePage';
import { XiaoShuziPage } from '@/pages/XiaoShuziPage';
import { WelcomePage } from '@/pages/WelcomePage';
import logoUrl from '@/assets/logo.png';

type Page = 'sixhe' | 'xiaoshuzi' | null;

function pathToPage(path: string): Page {
  const normalized = path.replace(/\/$/, '') || '/';
  if (normalized === '/chaidan') return 'sixhe';
  if (normalized === '/shuzi') return 'xiaoshuzi';
  return null;
}

function App() {
  const [page, setPage] = useState<Page>(() => pathToPage(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setPage(pathToPage(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="relative flex h-screen flex-col overflow-x-hidden p-4 md:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[15%] -top-[10%] h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-emerald-300/10 blur-[100px]" />
      </div>

      <div className="mx-auto flex h-full w-full max-w-7xl flex-col">
        {page !== null && (
          <header className="mb-6 flex shrink-0 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
                <img src={logoUrl} alt="sixhe" className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gradient md:text-3xl">sixhe</h1>
                <p className="text-xs text-slate-500">智能注单解析与拆单工具</p>
              </div>
            </div>
          </header>
        )}

        {page === 'sixhe' ? <SixhePage /> : page === 'xiaoshuzi' ? <XiaoShuziPage /> : <WelcomePage />}
      </div>
    </div>
  );
}

export default App;
