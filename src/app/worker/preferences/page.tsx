'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const THEMES = [
  { id: 'a', colors: ['#1c1714', '#8b7765', '#d8c8b4', '#f5efe6', '#b99a5b'], label: 'شنی کلاسیک' },
  { id: 'b', colors: ['#242424', '#8d8a84', '#c3a78e', '#f3f0ea', '#7a4f3a'], label: 'خاکستری گرم' },
  { id: 'c', colors: ['#2f3a2e', '#8e9a86', '#bbc7a4', '#ece7dd', '#5d4538'], label: 'سبز زیتونی' },
  { id: 'd', colors: ['#18202f', '#68748a', '#dce1e6', '#faf7f2', '#b8734f'], label: 'آبی شبانه' },
  { id: 'e', colors: ['#2d211b', '#7b5a48', '#e7d7c2', '#f8f1e8', '#b9784d'], label: 'قهوه‌ای گرم' },
  { id: 'f', colors: ['#211f1d', '#a39a90', '#e8dfd3', '#f7f4ef', '#b68a82'], label: 'کرم دودی' },
  { id: 'g', colors: ['#101317', '#343a40', '#aab2bd', '#f4f7fa', '#3b82f6'], label: 'آبی مدرن' },
  { id: 'h', colors: ['#3a2a22', '#b86f52', '#d9bfa3', '#f3e7d8', '#8c8a68'], label: 'تراکوتا' },
  { id: 'i', colors: ['#0e0e0e', '#2b2b2b', '#9a948b', '#fff8ea', '#d8c49a'], label: 'مشکی طلایی' },
  { id: 'j', colors: ['#2d1b2e', '#c48fa8', '#f5c6d6', '#fff5f7', '#e88fab'], label: 'رز دخترانه' },
  { id: 'k', colors: ['#1e293b', '#ec4899', '#06b6d4', '#ffffff', '#f59e0b'], label: 'رنگارنگ' },
];

export default function PreferencesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const save = async (themeId: string) => {
    setSelected(themeId);
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/worker/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در ذخیره');
        return;
      }
      setMessage(data.message || 'ذخیره شد');
      router.refresh();
    } catch {
      setError('خطا در اتصال به سرور');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="p-4 md:p-8 pb-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-cream tracking-tight">ظاهر پنل</h1>
          <p className="text-sm text-cream/40 mt-1">یک طرح رنگی انتخاب کن — بلافاصله اعمال می‌شود</p>
        </div>

        {message && (
          <p className="text-olive text-sm bg-olive/10 border border-olive/30 rounded-xl py-3 px-4 text-center font-medium">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/30 rounded-xl py-3 px-4 text-center font-medium">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => save(t.id)}
              disabled={saving}
              className={`luxury-card rounded-2xl p-4 text-left transition-all ${
                selected === t.id ? 'ring-2 ring-teal' : 'hover:-translate-y-1'
              } ${saving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
            >
              <div className="flex gap-1.5 mb-3">
                {t.colors.map((c, i) => (
                  <span
                    key={i}
                    className="w-8 h-8 rounded-lg shadow-sm border border-black/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="font-bold text-plum text-sm">طرح {t.id.toUpperCase()}</p>
              <p className="text-xs text-plum/50 mt-0.5">{t.label}</p>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-cream/30 pt-4">
          طرح انتخابی روی همه‌ی صفحه‌های پنل کارگر اعمال می‌شود.
        </p>
      </div>
    </div>
  );
}