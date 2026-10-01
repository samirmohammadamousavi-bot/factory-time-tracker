'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = items.filter((i) => !i.readAt).length;

  const markAll = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    load();
  };

  const openItem = async (n: Notification) => {
    if (!n.readAt) {
      await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
      load();
    }
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-cream/70 hover:text-cream hover:bg-cream/10 transition-all"
        aria-label="اعلان‌ها"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto luxury-card rounded-2xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream-darker/60">
            <span className="font-bold text-plum text-sm">اعلان‌ها</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs text-teal font-semibold hover:underline"
              >
                خواندن همه
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-center text-plum/40 text-sm py-8">اعلانی وجود ندارد</p>
          ) : (
            <ul className="divide-y divide-cream-darker/40">
              {items.map((n) => (
                <li key={n.id}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => openItem(n)}
                      className={`block px-4 py-3 hover:bg-cream-dark/30 transition-colors ${
                        !n.readAt ? 'bg-teal/5' : ''
                      }`}
                    >
                      <p className="text-sm font-bold text-plum">{n.title}</p>
                      {n.body && <p className="text-xs text-plum/60 mt-0.5">{n.body}</p>}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`w-full text-right px-4 py-3 hover:bg-cream-dark/30 transition-colors ${
                        !n.readAt ? 'bg-teal/5' : ''
                      }`}
                    >
                      <p className="text-sm font-bold text-plum">{n.title}</p>
                      {n.body && <p className="text-xs text-plum/60 mt-0.5">{n.body}</p>}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}