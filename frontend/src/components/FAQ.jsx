import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { faqs } from '../mock';

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section id="faqs" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-[960px] px-6 lg:px-10">
        <div className="text-center mb-12">
          <h2 className="text-[40px] sm:text-[52px] font-semibold tracking-tight text-neutral-900">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-[16px] text-neutral-500">
            Everything you need to know about Emergent.
          </p>
        </div>

        <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
          {faqs.map((f, i) => {
            const open = openIdx === i;
            return (
              <div key={i} className="py-6">
                <button onClick={() => setOpenIdx(open ? null : i)} className="w-full flex items-center justify-between text-left">
                  <span className="text-[18px] sm:text-[20px] font-semibold text-neutral-900">{f.q}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${open ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                    {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="text-[15px] text-neutral-600 leading-relaxed pr-12">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
