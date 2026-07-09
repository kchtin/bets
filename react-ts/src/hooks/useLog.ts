import { useState, useCallback, useRef, useEffect } from 'react';

export type LogType = 'info' | 'success' | 'error';

export interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: LogType;
}

export function useLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const append = useCallback((message: string, type: LogType = 'info') => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const entry: LogEntry = {
      id: ++idRef.current,
      time,
      message,
      type,
    };
    setLogs((prev) => [...prev, entry]);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return { logs, append, containerRef };
}
