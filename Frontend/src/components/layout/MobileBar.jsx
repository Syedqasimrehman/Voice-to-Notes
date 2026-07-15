import { Menu } from 'lucide-react';

const dotColor = {
  connected: 'bg-vl-teal',
  error: 'bg-vl-rust',
  checking: 'bg-vl-ink-faint',
};

export default function MobileBar({ onOpenSidebar, backendStatus }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-vl-border bg-vl-surface px-5 py-3.5 md:hidden">
      <button className="flex p-1 text-vl-ink" onClick={onOpenSidebar} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <span className="mr-auto font-fraunces text-[15px] font-semibold italic">آواز نامہ</span>
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor[backendStatus]}`} />
    </div>
  );
}
