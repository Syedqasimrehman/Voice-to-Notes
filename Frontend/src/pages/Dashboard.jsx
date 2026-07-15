import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import MobileBar from '../components/layout/MobileBar';
import RecordSeal from '../components/recorder/RecordSeal';
import AltInputRow from '../components/recorder/AltInputRow';
import BackendRow from '../components/recorder/BackendRow';
import PastePanel from '../components/recorder/PastePanel';
import ProgressBar from '../components/recorder/ProgressBar';
import ErrorBox from '../components/recorder/ErrorBox';
import TranscriptCard from '../components/results/TranscriptCard';
import ResultsColumns from '../components/results/ResultsColumns';
import Toolbar from '../components/results/Toolbar';
import { useLedger } from '../hooks/useLedger';
import { useRecorder } from '../hooks/useRecorder';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState('');

  const fileInputRef = useRef(null);
  const topRef = useRef(null);
  const notesColRef = useRef(null);
  const tasksColRef = useRef(null);

  const ledger = useLedger();
  const {
    backendUrl, setBackendUrl, backendState, backendBase, checkBackend,
    sealLabel, setSealLabel, progress, error, clearError, showError,
    transcript, transcriptRef, notes, tasks, copiedNotes, copiedTasks,
    processAudioBlob, handlePasteSubmit,
    toggleTaskDone, moveToTasks, moveToNotes, removeNote, removeTask,
    copyNotes, copyTasks, handleReset,
  } = ledger;

  const onRecordingComplete = async (blob) => {
    setSealLabel('Transcribing…');
    await processAudioBlob(blob);
    setSealLabel('Tap to record');
  };

  const { recording, barsRef, handleSealClick } = useRecorder(onRecordingComplete);

  // Keep the seal label in sync once recording actually starts (mic granted).
  useEffect(() => {
    if (recording) setSealLabel('Recording — tap to stop');
  }, [recording, setSealLabel]);

  const handleSealButton = () => {
    if (!recording) clearError();
    else setSealLabel('Transcribing…');
    handleSealClick(() => showError('Microphone access was blocked. Allow mic permissions, or upload a file instead.'));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) await processAudioBlob(file);
    e.target.value = '';
  };

  const submitPaste = () => {
    if (!pasteValue.trim()) return;
    setPasteOpen(false);
    handlePasteSubmit(pasteValue);
    setPasteValue('');
  };

  const scrollToRef = (ref) => {
    setSidebarOpen(false);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasResults = transcript !== '';

  return (
    <div className="relative flex min-h-screen bg-vl-bg font-karla text-vl-ink">
      <MobileBar onOpenSidebar={() => setSidebarOpen(true)} backendStatus={backendState.status} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[15] bg-black/35 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notesCount={notes.length}
        tasksCount={tasks.length}
        backendState={backendState}
        onScrollTop={() => scrollToRef(topRef)}
        onScrollNotes={() => scrollToRef(notesColRef)}
        onScrollTasks={() => scrollToRef(tasksColRef)}
      />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-12 pb-20 pt-11">
        <div ref={topRef} />

        <header className="mb-[34px]">
          <div className="mb-3 font-plexmono text-[11px] uppercase tracking-[0.16em] text-vl-amber">
            آواز نامہ &nbsp;·&nbsp; voice ledger
          </div>
          <h1 className="mb-2.5 font-fraunces text-[clamp(28px,4vw,40px)] font-semibold italic tracking-tight">
            Say it once <span className="font-nastaliq ms-1 font-bold not-italic text-vl-amber">بولیں</span>
          </h1>
          <p className="max-w-[560px] text-[15px] leading-relaxed text-vl-ink-dim">
            Speak or upload Urdu audio. It gets transcribed on your device, then sorted into notes to remember and tasks to do.
          </p>
        </header>

        <section className="mb-7 flex flex-col items-center gap-4 rounded-vl-lg bg-vl-surface px-6 pb-[34px] pt-[42px] shadow-vl-md">
          <RecordSeal
            recording={recording}
            sealLabel={sealLabel}
            barsRef={barsRef}
            onClick={handleSealButton}
          />

          <AltInputRow
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onPasteClick={() => setPasteOpen(true)}
          />

          <BackendRow
            backendUrl={backendUrl}
            setBackendUrl={setBackendUrl}
            backendState={backendState}
            onBlurCheck={checkBackend}
          />

          {pasteOpen && (
            <PastePanel
              value={pasteValue}
              onChange={setPasteValue}
              onCancel={() => setPasteOpen(false)}
              onSubmit={submitPaste}
            />
          )}

          {progress.show && <ProgressBar text={progress.text} pct={progress.pct} />}

          {error && <ErrorBox message={error} />}
        </section>

        {transcript && <TranscriptCard ref={transcriptRef} transcript={transcript} />}

        {hasResults && (
          <>
            <ResultsColumns
              notes={notes}
              tasks={tasks}
              notesRef={notesColRef}
              tasksRef={tasksColRef}
              onToggleTaskDone={toggleTaskDone}
              onMoveToTasks={moveToTasks}
              onMoveToNotes={moveToNotes}
              onRemoveNote={removeNote}
              onRemoveTask={removeTask}
            />

            <Toolbar
              copiedNotes={copiedNotes}
              copiedTasks={copiedTasks}
              onCopyNotes={copyNotes}
              onCopyTasks={copyTasks}
              onReset={handleReset}
            />
          </>
        )}

        <footer className="text-center font-plexmono text-[11px] text-vl-ink-faint">
          Transcription runs on your own machine via{' '}
          <code className="rounded bg-vl-surface-soft px-1.5 py-0.5">server.py</code> — audio is sent only to
          localhost, never to a remote server.
        </footer>
      </main>
    </div>
  );
}
