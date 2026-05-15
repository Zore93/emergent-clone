import React, { useState } from 'react';
import { Play, Youtube } from 'lucide-react';

export default function VideoSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="features" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-[1180px] px-6 lg:px-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 mb-4 text-[12px] font-medium text-neutral-700">
          PRODUCT VIDEO
          <Youtube className="w-4 h-4 text-red-500" />
        </div>
        <h2 className="text-[40px] sm:text-[52px] font-semibold tracking-tight text-neutral-900">
          See Emergent in Action
        </h2>

        <div className="mt-10 relative rounded-2xl overflow-hidden border border-neutral-200 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)] aspect-video bg-neutral-900">
          {playing ? (
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
              title="Emergent product video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button onClick={() => setPlaying(true)} className="group absolute inset-0 w-full h-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1600&q=80"
                alt="video poster"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl group-hover:scale-105 transition-transform">
                  <Play className="w-7 h-7 ml-1 text-neutral-900" fill="currentColor" />
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
