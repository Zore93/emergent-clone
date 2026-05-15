import React from 'react';

export default function Stats() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 mb-6 text-[12px] font-medium text-neutral-700">
          <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-[#ff6b2c] text-white text-[10px] font-bold">Y</span>
          Combinator S24
        </div>
        <h2 className="text-[44px] sm:text-[64px] lg:text-[72px] font-semibold tracking-tight leading-[1.05] text-neutral-900">
          <span className="text-neutral-900">3M+</span> <span className="text-neutral-400">users</span>
          <br />
          <span className="text-neutral-400">worldwide building &amp; launching</span>
          <br />
          <span className="text-neutral-400">real applications in </span>
          <span className="text-neutral-900">minutes.</span>
        </h2>
      </div>
    </section>
  );
}
