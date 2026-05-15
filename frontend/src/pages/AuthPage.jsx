import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (isSignup) await signup(email, password, name);
      else await login(email, password);
      const next = new URLSearchParams(loc.search).get('next') || '/dashboard';
      navigate(next);
    } catch (ex) {
      setErr(ex?.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-6 py-10">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-neutral-200 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.15)] p-8">
        <Link to="/" className="flex items-center justify-center">
          <img src="https://assets.emergent.sh/assets/Landing-Hero-E.gif" alt="" className="w-14 h-14" />
        </Link>
        <h1 className="mt-3 text-center text-[24px] font-semibold tracking-tight text-neutral-900">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-1 text-center text-[13px] text-neutral-500">
          {isSignup ? 'Start building full-stack apps in minutes.' : 'Log in to keep building.'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {isSignup && (
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-[14px] outline-none focus:border-neutral-900" />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-[14px] outline-none focus:border-neutral-900" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-[14px] outline-none focus:border-neutral-900" />

          {err && <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}

          <button disabled={loading} type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white py-3 text-[14px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-6 text-center text-[13px] text-neutral-600">
          {isSignup ? (<>Have an account? <Link to="/login" className="text-neutral-900 underline">Log in</Link></>) : (<>New here? <Link to="/signup" className="text-neutral-900 underline">Create an account</Link></>)}
        </div>
      </div>
    </div>
  );
}
