'use client';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';

export default function Gallery({ images = [], title = '' }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (!images.length) return <div className="aspect-[16/9] bg-secondary rounded-2xl" />;

  const main = images[0];
  const rest = images.slice(1, 5);

  function openAt(i) { setIdx(i); setOpen(true); }
  function prev() { setIdx((idx - 1 + images.length) % images.length); }
  function next() { setIdx((idx + 1) % images.length); }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[420px] md:h-[520px] rounded-2xl overflow-hidden">
        <button onClick={() => openAt(0)} className="relative md:col-span-2 md:row-span-2 group">
          <img src={main.url} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
        </button>
        {rest.map((im, i) => (
          <button key={im.id} onClick={() => openAt(i + 1)} className="relative hidden md:block group">
            <img src={im.url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
          </button>
        ))}
        {images.length > 5 && (
          <button onClick={() => openAt(5)} className="absolute right-6 bottom-6 z-10 px-4 py-2 rounded-full bg-white text-navy text-sm font-medium flex items-center gap-2 shadow-lg">
            <Expand className="h-4 w-4" /> Voir les {images.length} photos
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center" onClick={() => setOpen(false)}>
          <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><X className="h-5 w-5" /></button>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-5 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-5 h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronRight className="h-6 w-6" /></button>
          <img src={images[idx].url} alt="" className="max-h-[88vh] max-w-[92vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">{idx + 1} / {images.length}</div>
        </div>
      )}
    </>
  );
}
