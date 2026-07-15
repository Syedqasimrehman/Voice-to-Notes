import { Clipboard, Upload } from 'lucide-react';

export default function AltInputRow({ fileInputRef, onFileChange, onPasteClick }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <button className="pill-btn" onClick={() => fileInputRef.current?.click()}>
        <Upload size={14} /> Upload audio file
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={onFileChange}
        className="hidden"
      />
      <button className="pill-btn" onClick={onPasteClick}>
        <Clipboard size={14} /> Paste Urdu text instead
      </button>
    </div>
  );
}
