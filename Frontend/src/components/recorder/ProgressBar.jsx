export default function ProgressBar({ text, pct }) {
  return (
    <div className="mt-1 w-full max-w-[400px]">
      <div className="mb-1.5 flex justify-between font-plexmono text-[11px] text-vl-ink-dim">
        <span>{text}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-vl-surface-soft">
        <div
          className="h-full rounded-full bg-gradient-to-r from-vl-amber to-vl-amber-bright transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
