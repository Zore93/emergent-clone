import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { showcase } from '../mock';

export default function Showcase() {
  const [idx, setIdx] = useState(0);
  const next = () => setIdx((idx + 1) % showcase.length);
  const prev = () => setIdx((idx - 1 + showcase.length) % showcase.length);

  return (
    <section className="relative py-10 lg:py-16 overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="relative">
          {/* Carousel viewport */}
          <div className="relative h-[420px] sm:h-[520px] lg:h-[600px] flex items-center justify-center">
            {showcase.map((s, i) => {
              const offset = i - idx;
              const abs = Math.abs(offset);
              const visible = abs <= 1;
              return (
                <div
                  key={i}
                  className="absolute transition-all duration-700 ease-out"
                  style={{
                    transform: `translateX(${offset * 60}%) scale(${1 - abs * 0.15})`,
                    opacity: visible ? (abs === 0 ? 1 : 0.45) : 0,
                    zIndex: 10 - abs,
                    filter: abs === 0 ? 'none' : 'blur(0.5px)',
                  }}
                >
                  <div className="relative">
                    <img src={s.lap} alt="laptop" className="w-[680px] max-w-[80vw] drop-shadow-2xl" />
                    <img src={s.mob} alt="mobile" className="absolute -left-12 sm:-left-20 bottom-[-30px] w-[150px] sm:w-[190px] drop-shadow-2xl" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arrows */}
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors z-20">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-700 transition-colors z-20">
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="mt-8 flex justify-center gap-2">
            {showcase.map((_, i) => (
              <span
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full cursor-pointer transition-all ${i === idx ? 'w-8 bg-neutral-900' : 'w-1.5 bg-neutral-300'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
