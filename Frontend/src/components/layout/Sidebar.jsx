import {
  Archive, CheckSquare, LayoutDashboard, Mic, Settings, StickyNote, Wifi, WifiOff, X,
} from 'lucide-react';

const statusColor = {
  connected: 'text-vl-teal',
  error: 'text-vl-rust',
  checking: 'text-vl-ink-faint',
};

export default function Sidebar({
  open, onClose, notesCount, tasksCount, backendState,
  onScrollTop, onScrollNotes, onScrollTasks,
}) {
  return (
    <aside
      className={`fixed md:sticky top-0 left-0 z-20 flex h-screen w-[260px] flex-shrink-0 flex-col
        border-r border-vl-border bg-vl-surface p-4 pt-[22px]
        shadow-[4px_0_24px_rgba(21,24,31,0.03)] transition-transform duration-[250ms] ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="flex items-center gap-2.5 px-2 pb-[22px] pt-1.5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-vl-amber-bright to-vl-amber font-nastaliq text-[19px] text-white shadow-vl-sm">
          آ
        </div>
        <div>
          <div className="font-fraunces text-[15px] font-semibold italic text-vl-ink">آواز نامہ</div>
          <div className="font-plexmono text-[10px] uppercase tracking-wider text-vl-ink-faint">Voice Ledger</div>
        </div>
        <button
          className="ml-auto flex p-1 text-vl-ink md:hidden"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-1.5 flex flex-1 flex-col gap-0.5">
        <div className="mx-2.5 mb-1.5 mt-4 font-plexmono text-[10px] uppercase tracking-wider text-vl-ink-faint">
          Workspace
        </div>
        <NavItem icon={<LayoutDashboard size={17} />} label="Overview" onClick={onScrollTop} />
        <NavItem icon={<Mic size={17} />} label="New recording" active />
        <NavItem icon={<StickyNote size={17} />} label="Notes" onClick={onScrollNotes} count={notesCount} />
        <NavItem icon={<CheckSquare size={17} />} label="Tasks" onClick={onScrollTasks} count={tasksCount} />
        <NavItem icon={<Archive size={17} />} label="Archive" disabled />

        <div className="mx-2.5 mb-1.5 mt-4 font-plexmono text-[10px] uppercase tracking-wider text-vl-ink-faint">
          General
        </div>
        <NavItem icon={<Settings size={17} />} label="Settings" disabled />
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-vl-border pt-4">
        <div className={`flex items-center gap-1.5 rounded-full bg-vl-surface-soft px-2.5 py-[7px] font-plexmono text-[11px] shadow-vl-xs ${statusColor[backendState.status]}`}>
          {backendState.status === 'connected' ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{backendState.status === 'connected' ? 'Backend online' : 'Backend offline'}</span>
        </div>
        <div className="px-0.5 text-[11px] leading-relaxed text-vl-ink-faint">
          Audio never leaves your machine.
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, disabled, count, onClick }) {
  return (
    <button
      className={`flex w-full items-center gap-[11px] rounded-vl-sm px-3 py-2.5 text-left font-karla text-[13.5px] font-semibold
        transition-colors duration-150
        ${active ? 'bg-vl-amber-soft text-[#8A5D19] shadow-vl-xs' : 'text-vl-ink-dim hover:bg-vl-surface-soft hover:text-vl-ink'}
        ${disabled ? 'pointer-events-none cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon} <span>{label}</span>
      {count > 0 && (
        <span className="ml-auto rounded-full bg-vl-surface-soft px-[7px] py-0.5 font-plexmono text-[10.5px] text-vl-ink-dim">
          {count}
        </span>
      )}
    </button>
  );
}
