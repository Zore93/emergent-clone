import React from 'react';
import { ArrowRight, Github, Twitter, Linkedin, Youtube } from 'lucide-react';

export default function Footer({ onGetStarted }) {
  return (
    <footer id="enterprise" className="relative pt-16 overflow-hidden">
      {/* CTA Cloud strip */}
      <div className="relative">
        <div className="relative h-[440px] sm:h-[520px] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=2400&q=80"
            alt="clouds"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
            <h2 className="text-[42px] sm:text-[68px] font-semibold tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] leading-[1.05]">
              Your idea, deployed.
              <br />
              In minutes.
            </h2>
            <button onClick={onGetStarted} className="mt-10 group inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white pl-6 pr-2 py-2.5 text-[15px] font-medium hover:bg-neutral-800 transition-colors">
              Start Building Free
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom links */}
      <div className="bg-neutral-950 text-neutral-300">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-14 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <span className="text-[24px] font-semibold tracking-tight text-white lowercase" style={{ fontFamily: "'Instrument Sans', 'Inter', sans-serif" }}>emergent</span>
            <p className="mt-3 text-[13px] text-neutral-400 max-w-xs">Build real, production-grade apps with AI — in minutes, not months.</p>
            <div className="mt-5 flex items-center gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="h-9 w-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"><Github className="w-4 h-4" /></a>
              <a href="#" className="h-9 w-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"><Linkedin className="w-4 h-4" /></a>
              <a href="#" className="h-9 w-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"><Youtube className="w-4 h-4" /></a>
            </div>
          </div>
          <FooterCol title="Product" items={['Features', 'Pricing', 'Changelog', 'Roadmap']} />
          <FooterCol title="Resources" items={['Docs', 'Templates', 'Guides', 'Blog']} />
          <FooterCol title="Company" items={['About', 'Careers', 'Press', 'Contact']} />
          <FooterCol title="Legal" items={['Terms', 'Privacy', 'Cookies', 'DPA']} />
        </div>
        <div className="border-t border-neutral-800">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-5 flex items-center justify-between flex-wrap gap-3 text-[12px] text-neutral-500">
            <span>© {new Date().getFullYear()} Emergent. All rights reserved.</span>
            <span>Made with care, shipped with speed.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-white mb-3">{title}</div>
      <ul className="space-y-2 text-[13px]">
        {items.map((i) => (
          <li key={i}><a href="#" className="text-neutral-400 hover:text-white transition-colors">{i}</a></li>
        ))}
      </ul>
    </div>
  );
}
