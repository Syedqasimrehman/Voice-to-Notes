import { Check } from 'lucide-react';

export default function ListItem({
  entry, isTask, done, onToggleDone, onMove, moveLabel, onRemove,
}) {
  return (
    <div className={`flex items-start gap-2.5 border-b border-vl-border py-[11px] px-1 text-[15px] leading-relaxed last:border-b-0`}>
      {isTask && (
        <button
          className={`mt-[3px] flex h-[17px] w-[17px] flex-shrink-0 items-center justify-center rounded-[5px]
            border-[1.5px] border-vl-rust p-0 text-white ${done ? 'bg-vl-rust' : 'bg-transparent'}`}
          onClick={onToggleDone}
          aria-label="Toggle done"
        >
          {done && <Check size={11} strokeWidth={3} />}
        </button>
      )}
      <div className={`vl-rtl flex-1 text-lg ${done ? 'text-vl-ink/40 line-through' : ''}`}>
        {entry.text}
      </div>
      <div className="mt-0.5 flex flex-col gap-1.5">
        <button
          className="font-plexmono text-[11px] text-vl-ink-faint opacity-70 transition-opacity hover:text-vl-amber hover:opacity-100"
          onClick={onMove}
        >
          {moveLabel}
        </button>
        <button
          className="font-plexmono text-[11px] text-vl-ink-faint opacity-70 transition-opacity hover:text-vl-amber hover:opacity-100"
          onClick={onRemove}
        >
          remove
        </button>
      </div>
    </div>
  );
}
