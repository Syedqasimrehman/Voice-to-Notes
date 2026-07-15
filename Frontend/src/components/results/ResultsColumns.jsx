import ListItem from './ListItem';

export default function ResultsColumns({
  notes, tasks, notesRef, tasksRef,
  onToggleTaskDone, onMoveToTasks, onMoveToNotes, onRemoveNote, onRemoveTask,
}) {
  return (
    <section className="mb-[26px] grid grid-cols-1 gap-[22px] md:grid-cols-2">
      <div ref={notesRef} className="min-h-[120px] rounded-vl-md bg-vl-surface p-5 pb-3 shadow-vl-sm">
        <ColHead dotClass="bg-vl-teal" title="Notes" count={notes.length} />
        {notes.length === 0 ? (
          <EmptyState text="Nothing filed as a note yet." />
        ) : (
          notes.map((entry) => (
            <ListItem
              key={entry.id}
              entry={entry}
              isTask={false}
              onMove={() => onMoveToTasks(entry.id)}
              moveLabel="→ task"
              onRemove={() => onRemoveNote(entry.id)}
            />
          ))
        )}
      </div>

      <div ref={tasksRef} className="min-h-[120px] rounded-vl-md bg-vl-surface p-5 pb-3 shadow-vl-sm">
        <ColHead dotClass="bg-vl-rust" title="Tasks" count={tasks.length} />
        {tasks.length === 0 ? (
          <EmptyState text="No action items found." />
        ) : (
          tasks.map((entry) => (
            <ListItem
              key={entry.id}
              entry={entry}
              isTask
              done={entry.done}
              onToggleDone={() => onToggleTaskDone(entry.id)}
              onMove={() => onMoveToNotes(entry.id)}
              moveLabel="→ note"
              onRemove={() => onRemoveTask(entry.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ColHead({ dotClass, title, count }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className={`h-[9px] w-[9px] rounded-full ${dotClass}`} />
      <span className="font-fraunces text-lg font-semibold italic">{title}</span>
      <span className="ml-auto font-plexmono text-[11px] text-vl-ink-faint">{count}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="px-1 py-2.5 text-[13px] italic text-vl-ink-faint">{text}</div>;
}
