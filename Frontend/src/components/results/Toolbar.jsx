import { Copy, RotateCcw } from 'lucide-react';

export default function Toolbar({ copiedNotes, copiedTasks, onCopyNotes, onCopyTasks, onReset }) {
  return (
    <div className="mb-10 flex justify-center gap-3">
      <button className="pill-btn" onClick={onCopyNotes}>
        <Copy size={13} /> {copiedNotes ? 'Copied!' : 'Copy notes'}
      </button>
      <button className="pill-btn" onClick={onCopyTasks}>
        <Copy size={13} /> {copiedTasks ? 'Copied!' : 'Copy tasks'}
      </button>
      <button className="pill-btn" onClick={onReset}>
        <RotateCcw size={13} /> Start over
      </button>
    </div>
  );
}
