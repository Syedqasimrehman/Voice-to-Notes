import { useCallback, useRef, useState } from 'react';
import { decodeToFloat32, encodeWav } from '../lib/audio';
import { extractEntries } from '../lib/classify';
import { useBackend } from './useBackend';

export function useLedger() {
  const { backendUrl, setBackendUrl, backendState, backendBase, checkBackend } = useBackend();

  const [sealLabel, setSealLabel] = useState('Tap to record');
  const [progress, setProgress] = useState({ show: false, text: '', pct: 0 });
  const [error, setError] = useState('');

  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [copiedNotes, setCopiedNotes] = useState(false);
  const [copiedTasks, setCopiedTasks] = useState(false);

  const transcriptRef = useRef(null);

  const clearError = () => setError('');
  const showError = (msg) => setError(msg);
  const setProgressState = (text, pct) => setProgress({ show: true, text, pct: Math.round(pct) });
  const hideProgress = () => setProgress((p) => ({ ...p, show: false }));

  const makeId = () => (
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2)
  );

  const transcribeViaBackend = useCallback(async (float32) => {
    const wavBlob = encodeWav(float32, 16000);
    const form = new FormData();
    form.append('file', wavBlob, 'audio.wav');
    const res = await fetch(backendBase() + '/transcribe', { method: 'POST', body: form });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error('Backend error: ' + detail);
    }
    const data = await res.json();

    // Backend returns notes/tasks as plain string arrays; the rest of this
    // hook (toggleTaskDone, moveToTasks/moveToNotes, copyNotes/copyTasks)
    // expects { id, text, done } objects.
    const toEntries = (arr) => (Array.isArray(arr) ? arr : []).map((text) => ({
      id: makeId(),
      text,
      done: false,
    }));

    setNotes(toEntries(data.notes));
    setTasks(toEntries(data.tasks));

    return data.text || '';
  }, [backendBase]);

  const runExtraction = useCallback((fullText) => {
    const { notes: newNotes, tasks: newTasks } = extractEntries(fullText);
    setNotes(newNotes);
    setTasks(newTasks);
  }, []);

  const showTranscript = useCallback((text) => {
    setTranscript(text);
    requestAnimationFrame(() => {
      transcriptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  const processAudioBlob = useCallback(async (blob) => {
    clearError();
    setSealLabel('Transcribing…');
    const ok = await checkBackend();
    if (!ok) {
      setSealLabel('Tap to record');
      showError('Backend not reachable at ' + backendBase() + '. Run "python server.py" first, then retry.');
      return;
    }
    try {
      setProgressState('Transcribing audio…', 40);
      const float32 = await decodeToFloat32(blob);
      setProgressState('Transcribing audio…', 70);
      const text = (await transcribeViaBackend(float32)).trim();
      hideProgress();
      setSealLabel('Tap to record');
      if (!text) {
        showError('No speech detected. Try again closer to the mic, or upload a clearer file.');
        return;
      }
      showTranscript(text);
      // runExtraction(text);
    } catch (err) {
      hideProgress();
      setSealLabel('Tap to record');
      showError('Transcription failed: ' + err.message);
    }
  // }, [checkBackend, backendBase, transcribeViaBackend, showTranscript, runExtraction]);
  }, [checkBackend, backendBase, transcribeViaBackend, showTranscript]);

  const handlePasteSubmit = useCallback((rawText) => {
    const txt = rawText.trim();
    if (!txt) return;
    showTranscript(txt);
    // runExtraction(txt);
  // }, [showTranscript, runExtraction]);
  }, [showTranscript]);

  const toggleTaskDone = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const moveToTasks = (id) => {
    setNotes((prev) => {
      const entry = prev.find((n) => n.id === id);
      if (!entry) return prev;
      setTasks((t) => [...t, entry]);
      return prev.filter((n) => n.id !== id);
    });
  };

  const moveToNotes = (id) => {
    setTasks((prev) => {
      const entry = prev.find((t) => t.id === id);
      if (!entry) return prev;
      setNotes((n) => [...n, entry]);
      return prev.filter((t) => t.id !== id);
    });
  };

  const removeNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));
  const removeTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const copyNotes = () => {
    const t = notes.map((n) => '• ' + n.text).join('\n');
    navigator.clipboard.writeText(t);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 1400);
  };

  const copyTasks = () => {
    const t = tasks.map((n) => (n.done ? '[x] ' : '[ ] ') + n.text).join('\n');
    navigator.clipboard.writeText(t);
    setCopiedTasks(true);
    setTimeout(() => setCopiedTasks(false), 1400);
  };

  const handleReset = () => {
    setNotes([]);
    setTasks([]);
    setTranscript('');
    clearError();
  };

  return {
    // backend
    backendUrl, setBackendUrl, backendState, backendBase, checkBackend,
    // pipeline state
    sealLabel, setSealLabel, progress, error, clearError, showError,
    transcript, transcriptRef, notes, tasks,
    copiedNotes, copiedTasks,
    // actions
    processAudioBlob, handlePasteSubmit,
    toggleTaskDone, moveToTasks, moveToNotes, removeNote, removeTask,
    copyNotes, copyTasks, handleReset,
  };
}