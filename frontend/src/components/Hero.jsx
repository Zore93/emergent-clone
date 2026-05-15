import React, { useState, useEffect } from 'react';
import { Github, Apple, Facebook, Mail, ArrowLeft, ArrowRight, Bot, BarChart3, Workflow, Plus, PenLine, Headphones, Search, TrendingUp, Code2, CheckCircle2, Database, Server, DollarSign, Users, Scale, Megaphone } from 'lucide-react';
import { agentSlides } from '../mock';

const iconMap = { Bot, BarChart3, Workflow, Plus, PenLine, Headphones, Search, TrendingUp, Code2, CheckCircle2, Database, Server, DollarSign, Users, Scale, Megaphone };

export default function Hero({ onContinue }) {
  const [idx, setIdx] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % agentSlides.length), 5500);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="top" className="relative pt-[72px] pb-12 overflow-hidden">
      {/* subtle decorative background characters */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] select-none" style={{
        backgroundImage: "url('https://assets.emergent.sh/assets/landing-page/landing-bg-light.png')",
        backgroundSize: '1400px auto',
        backgroundRepeat: 'repeat',
      }} />

      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-2 gap-10 px-6 lg:px-10 pt-16 lg:pt-20">
        {/* LEFT */}
        <div className="flex flex-col items-center text-center px-2 lg:px-10 lg:pt-10">
          <img
            src="https://assets.emergent.sh/assets/Landing-Hero-E.gif"
            alt="Emergent"
            className="w-[88px] h-[88px] mb-6"
          />
          <h1 className="text-[44px] sm:text-[52px] leading-[1.05] tracking-tight text-neutral-900 font-semibold">
            Build Full-Stack
          </h1>
          <h2 className="text-[36px] sm:text-[44px] leading-[1.1] tracking-tight font-semibold bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #4d8cf5 0%, #9bbcff 50%, #4d8cf5 100%)' }}>
            Web &amp; Mobile Apps in minutes
          </h2>

          <button
            onClick={onContinue}
            className="mt-10 w-full max-w-[440px] inline-flex items-center justify-center gap-3 rounded-full bg-neutral-900 text-white py-[14px] text-[15px] font-medium hover:bg-neutral-800 transition-colors"
          >
            <img src="https://assets.emergent.sh/assets/Google.svg" alt="" className="w-5 h-5 bg-white rounded-full p-[3px]" />
            Continue with Google
          </button>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={onContinue} className="h-11 w-11 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-800 transition-colors" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </button>
            <button onClick={onContinue} className="h-11 w-11 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-800 transition-colors" aria-label="Apple">
              <Apple className="w-5 h-5" />
            </button>
            <button onClick={onContinue} className="h-11 w-11 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-800 transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={onContinue}
            className="mt-4 w-full max-w-[440px] inline-flex items-center justify-center gap-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-[14px] text-[15px] font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            Continue with Email
          </button>

          <p className="mt-6 text-[12px] text-neutral-500 max-w-[440px] leading-5">
            By continuing, you agree to our{' '}
            <a href="#" className="underline text-neutral-700">Terms of Service</a> and{' '}
            <a href="#" className="underline text-neutral-700">Privacy Policy</a>.
          </p>
        </div>

        {/* RIGHT */}
        <div className="relative h-[640px] lg:h-[700px] rounded-[28px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(20,80,180,0.45)]"
             style={{ background: 'radial-gradient(120% 110% at 70% 30%, #cfe7ff 0%, #6fb7ff 35%, #2aa7d6 65%, #5ad9c6 100%)' }}>
          {/* YC badge */}
          <div className="absolute top-5 right-5 z-10 flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1.5 text-[13px] font-medium text-neutral-900 shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#ff6b2c] text-white text-[11px] font-bold">Y</span>
            Combinator S24
          </div>

          <div className="flex flex-col h-full px-8 sm:px-12 pt-16 pb-10">
            <div className="text-center text-white">
              <h3 className="text-[34px] sm:text-[40px] font-semibold tracking-tight">10k+ custom agents</h3>
              <p className="mt-3 text-[15px] sm:text-[16px] text-white/85 max-w-[520px] mx-auto leading-snug">
                created by users for - powering research, analytics, automation, content generation, and more.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-5 flex-1">
              {agentSlides[idx].map((a) => {
                const Icon = iconMap[a.icon] || Bot;
                return (
                  <div
                    key={a.name}
                    className="group relative rounded-2xl bg-neutral-900 text-white p-5 sm:p-6 overflow-hidden hover:-translate-y-0.5 transition-transform"
                  >
                    <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center mb-6">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-[18px] font-semibold">{a.name}</div>
                    <div className="mt-2 text-[13px] text-white/65 leading-snug">{a.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* dots + arrows */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => setIdx((idx - 1 + agentSlides.length) % agentSlides.length)} className="h-8 w-8 rounded-full bg-white/30 hover:bg-white/45 text-white flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                {agentSlides.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-1.5 rounded-full cursor-pointer transition-all ${i === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/60'}`}
                  />
                ))}
              </div>
              <button onClick={() => setIdx((idx + 1) % agentSlides.length)} className="h-8 w-8 rounded-full bg-white/30 hover:bg-white/45 text-white flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
