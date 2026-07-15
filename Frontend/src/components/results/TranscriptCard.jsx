import { forwardRef } from 'react';

const TranscriptCard = forwardRef(function TranscriptCard({ transcript }, ref) {
  return (
    <section
      ref={ref}
      className="relative mb-7 rounded-vl-lg bg-vl-surface p-8 py-[30px] shadow-vl-lg
        before:pointer-events-none before:absolute before:inset-x-6 before:top-3.5 before:bottom-3.5
        before:rounded-[10px] before:border before:border-vl-border before:content-['']"
    >
      <div className="mb-2.5 font-plexmono text-[10px] uppercase tracking-wider text-vl-ink-faint">
        Transcript
      </div>
      <div className="vl-rtl whitespace-pre-wrap text-xl leading-[2.05] text-vl-ink">
        {transcript}
      </div>
    </section>
  );
});

export default TranscriptCard;
