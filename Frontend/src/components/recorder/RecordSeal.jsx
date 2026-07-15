import { Mic } from 'lucide-react';

export default function RecordSeal({ recording, sealLabel, barsRef, onClick }) {
  return (
    <>
      <button
        className={`relative flex h-[120px] w-[120px] items-center justify-center rounded-full border-none
          bg-gradient-to-br from-white via-[#F6F4EF] to-[#EFE8DA]
          transition-transform duration-150 ease-out hover:scale-[1.03] active:scale-[0.97]
          ${recording
            ? 'animate-vl-pulse shadow-[0_0_0_6px_rgba(193,87,63,0.10),0_16px_36px_rgba(193,87,63,0.30),inset_0_1px_2px_rgba(255,255,255,0.9)]'
            : 'shadow-[0_24px_48px_rgba(21,24,31,0.12),0_8px_20px_rgba(21,24,31,0.06),inset_0_1px_2px_rgba(255,255,255,0.9),inset_0_-6px_14px_rgba(21,24,31,0.06)]'}`}
        onClick={onClick}
        aria-label="Record"
      >
        <span className={`absolute -inset-[13px] rounded-full border-[1.5px] border-vl-amber opacity-30 ${recording ? 'animate-vl-expand' : ''}`} />
        <span className={`absolute -inset-6 rounded-full border-[1.5px] border-vl-amber opacity-15 ${recording ? 'animate-vl-expand-delay' : ''}`} />
        <Mic size={32} className="relative z-10 text-vl-rust" />
      </button>

      <div className="flex h-[26px] items-end gap-[3px]">
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            className="h-1 w-[3px] rounded-sm bg-vl-amber transition-[height] duration-100 ease-out"
          />
        ))}
      </div>

      <div className="min-h-[16px] font-plexmono text-xs tracking-wide text-vl-ink-dim">{sealLabel}</div>
    </>
  );
}
