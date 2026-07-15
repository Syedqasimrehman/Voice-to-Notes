export default function PastePanel({ value, onChange, onCancel, onSubmit }) {
  return (
    <div className="mt-1.5 w-full max-w-[600px] rounded-vl-md border border-vl-border bg-vl-surface-soft p-4 shadow-vl-sm">
      <textarea
        className="vl-rtl min-h-[100px] w-full resize-y rounded-[10px] border border-vl-border
          bg-vl-surface p-3 text-lg text-vl-ink"
        placeholder="اردو متن یہاں لکھیں…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-2.5 flex justify-end gap-2.5">
        <button className="pill-btn" onClick={onCancel}>Cancel</button>
        <button className="primary-btn" onClick={onSubmit}>Sort into notes &amp; tasks</button>
      </div>
    </div>
  );
}
