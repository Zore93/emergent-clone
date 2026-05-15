import React, { useState } from 'react';
import { LayoutGrid, Bot, Plug, ChevronDown } from 'lucide-react';
import { featureTabs } from '../mock';

const iconMap = { LayoutGrid, Bot, Plug };

export default function Features() {
  const [active, setActive] = useState('apps');

  return (
    <section className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-[40px] sm:text-[52px] font-semibold tracking-tight text-neutral-900">
            What can Emergent do for you?
          </h2>
          <p className="mt-4 text-[16px] text-neutral-500">
            From concept to deployment, Emergent handles every aspect of software development
            so you can focus on what matters most - your vision!
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* LEFT: accordion items */}
          <div className="flex flex-col">
            {featureTabs.map((t, i) => {
              const Icon = iconMap[t.icon];
              const open = active === t.id;
              return (
                <div key={t.id} className={`border-t ${i === featureTabs.length - 1 ? 'border-b' : ''} border-neutral-200 py-5`}>
                  <button onClick={() => setActive(t.id)} className="w-full flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${open ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className={`text-[20px] font-semibold ${open ? 'text-neutral-900' : 'text-neutral-700'}`}>{t.title}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="text-[15px] text-neutral-500 leading-relaxed pl-12 pr-4">{t.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: visual */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-white aspect-[4/3] flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80"
                alt="emergent showcase"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
