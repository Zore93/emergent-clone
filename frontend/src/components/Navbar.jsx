import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { navLinks } from '../mock';

export default function Navbar({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background,backdrop-filter,box-shadow] duration-300 ${
        scrolled
          ? 'bg-white/70 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 lg:px-10 h-[72px]">
        <a href="#top" className="flex items-center select-none">
          <span className="text-[26px] font-semibold tracking-tight text-neutral-900 lowercase" style={{ fontFamily: "'Instrument Sans', 'Inter', sans-serif" }}>
            emergent
          </span>
        </a>
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-9">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[15px] text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <button
          onClick={onGetStarted}
          className="group inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white pl-5 pr-2 py-2 text-[14px] font-medium hover:bg-neutral-800 transition-colors"
        >
          Get Started
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>
    </header>
  );
}
