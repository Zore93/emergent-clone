import React, { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import { apiClient, useAuth } from '../lib/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Coins, Loader2 } from 'lucide-react';

export default function Billing() {
  const { user, refresh } = useAuth();
  const [packages, setPackages] = useState([]);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    apiClient.get('/public/packages').then((r) => setPackages(r.data));
  }, []);

  const buy = async (pkg) => {
    setBusy(pkg.id); setErr('');
    try {
      const r = await apiClient.post('/payments/checkout', { package_id: pkg.id, origin_url: window.location.origin });
      window.location.href = r.data.url;
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Could not start checkout');
      setBusy('');
    }
  };

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-neutral-900">Billing &amp; credits</h1>
        <p className="text-[14px] text-neutral-500 mt-1">Top up your account to keep building. 1 credit = 1 AI generation.</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex items-center gap-4 mb-6">
        <Coins className="w-7 h-7 text-amber-500" />
        <div>
          <div className="text-[13px] text-neutral-500">Current balance</div>
          <div className="text-[28px] font-semibold text-neutral-900">{user?.credits ?? 0} credits</div>
        </div>
      </div>

      {err && <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((p) => (
          <div key={p.id} className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col">
            <div className="text-[18px] font-semibold text-neutral-900">{p.name}</div>
            <div className="text-[13px] text-neutral-500 mt-1">{p.description}</div>
            <div className="mt-5 flex items-end gap-1">
              <span className="text-[34px] font-semibold text-neutral-900 leading-none">${p.price_usd}</span>
              <span className="text-[13px] text-neutral-500 mb-1">one-time</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 text-[13px] text-neutral-700"><Check className="w-4 h-4 text-blue-600" /> {p.credits} credits</div>
            <button onClick={() => buy(p)} disabled={busy === p.id} className="mt-6 rounded-full bg-neutral-900 text-white py-2.5 text-[14px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Buy {p.name}
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export function BillingSuccess() {
  const [sp] = useSearchParams();
  const sessionId = sp.get('session_id');
  const [status, setStatus] = useState('checking');
  const { refresh } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    let attempts = 0; let timer;
    const poll = async () => {
      attempts += 1;
      try {
        const r = await apiClient.get(`/payments/status/${sessionId}`);
        if (r.data.payment_status === 'paid') { setStatus('paid'); refresh(); return; }
        if (attempts >= 8) { setStatus('pending'); return; }
        timer = setTimeout(poll, 2000);
      } catch {
        if (attempts >= 8) setStatus('error'); else timer = setTimeout(poll, 2000);
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [sessionId, refresh]);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto bg-white border border-neutral-200 rounded-2xl p-8 text-center">
        {status === 'checking' && (<><Loader2 className="w-8 h-8 mx-auto animate-spin text-neutral-400" /><p className="mt-3 text-neutral-700">Confirming your payment…</p></>)}
        {status === 'paid' && (<><div className="text-[22px] font-semibold text-neutral-900">Payment successful!</div><p className="mt-2 text-neutral-600">Your credits have been added to your account.</p><button onClick={() => nav('/dashboard')} className="mt-6 rounded-full bg-neutral-900 text-white px-4 py-2 text-[14px]">Back to projects</button></>)}
        {status === 'pending' && (<><div className="text-[20px] font-semibold text-neutral-900">Payment processing</div><p className="mt-2 text-neutral-600">It’s taking longer than expected. We will credit your account as soon as Stripe confirms.</p></>)}
        {status === 'error' && (<><div className="text-[20px] font-semibold text-red-600">Could not confirm payment</div><p className="mt-2 text-neutral-600">Please contact support.</p></>)}
      </div>
    </AppShell>
  );
}
