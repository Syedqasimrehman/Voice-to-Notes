const dotColor = {
  connected: 'bg-vl-teal',
  error: 'bg-vl-rust',
  checking: 'bg-vl-ink-faint',
};

export default function BackendRow({ backendUrl, setBackendUrl, backendState, onBlurCheck }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-center justify-center gap-2.5">
      <input
        className="w-[220px] rounded-full border border-vl-border bg-vl-surface-soft px-3.5 py-2
          font-plexmono text-xs text-vl-ink"
        type="text"
        value={backendUrl}
        spellCheck={false}
        onChange={(e) => setBackendUrl(e.target.value)}
        onBlur={onBlurCheck}
      />
      <span className="flex items-center gap-1.5 font-plexmono text-[11px] text-vl-ink-dim">
        <span className={`inline-block h-2 w-2 rounded-full ${dotColor[backendState.status]}`} />
        {backendState.label}
      </span>
    </div>
  );
}
