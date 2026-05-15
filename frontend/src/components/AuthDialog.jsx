import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Github, Apple, Facebook, Mail, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function AuthDialog({ open, onOpenChange }) {
  const [mode, setMode] = useState('main'); // main | email | sso
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSubmit = (label) => {
    toast({ title: `Welcome to Emergent!`, description: `${label} — demo only. No real auth.` });
    onOpenChange(false);
    setMode('main');
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl p-8 border-none">
        <div className="flex flex-col items-center text-center">
          <img
            src="https://assets.emergent.sh/assets/Landing-Hero-E.gif"
            alt="Emergent"
            className="w-16 h-16 mb-4"
          />
          <h3 className="text-[22px] font-semibold tracking-tight text-neutral-900">
            {mode === 'email' ? 'Continue with Email' : mode === 'sso' ? 'Continue with SSO' : 'Sign in to Emergent'}
          </h3>
          <p className="mt-1 text-[13px] text-neutral-500">Build full-stack apps in minutes.</p>

          {mode === 'main' && (
            <div className="w-full mt-6 space-y-3">
              <button onClick={() => handleSubmit('Continue with Google')} className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-neutral-900 text-white py-3 text-[14px] font-medium hover:bg-neutral-800 transition-colors">
                <img src="https://assets.emergent.sh/assets/Google.svg" alt="" className="w-5 h-5 bg-white rounded-full p-[3px]" />
                Continue with Google
              </button>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => handleSubmit('GitHub')} className="h-11 w-11 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-800 transition-colors"><Github className="w-5 h-5" /></button>
                <button onClick={() => handleSubmit('Apple')} className="h-11 w-11 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-800 transition-colors"><Apple className="w-5 h-5" /></button>
                <button onClick={() => handleSubmit('Facebook')} className="h-11 w-11 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-800 transition-colors"><Facebook className="w-5 h-5" /></button>
              </div>
              <button onClick={() => setMode('email')} className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-3 text-[14px] font-medium transition-colors">
                <Mail className="w-4 h-4" />
                Continue with Email
              </button>
              <button onClick={() => setMode('sso')} className="w-full text-center text-[13px] text-neutral-500 underline hover:text-neutral-700 mt-2">
                Continue with SSO
              </button>
            </div>
          )}

          {(mode === 'email' || mode === 'sso') && (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(mode === 'email' ? 'Email link sent' : 'SSO redirect'); }} className="w-full mt-6 space-y-3">
              <input
                type="email"
                required
                placeholder={mode === 'sso' ? 'you@company.com' : 'name@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full bg-neutral-100 px-5 py-3 text-[14px] outline-none focus:ring-2 focus:ring-neutral-300"
              />
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white py-3 text-[14px] font-medium hover:bg-neutral-800 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setMode('main')} className="w-full text-center text-[13px] text-neutral-500 hover:text-neutral-700">
                Back to all options
              </button>
            </form>
          )}

          <p className="mt-6 text-[11px] text-neutral-500 max-w-[320px] leading-5">
            By continuing, you agree to our{' '}
            <a href="#" className="underline text-neutral-700">Terms of Service</a> and{' '}
            <a href="#" className="underline text-neutral-700">Privacy Policy</a>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
