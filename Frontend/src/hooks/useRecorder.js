import { useCallback, useEffect, useRef, useState } from 'react';

// Handles microphone capture, MediaRecorder lifecycle, and the bar-graph
// waveform visualizer. Calls `onRecordingComplete(blob)` once a recording
// is stopped and finalized.
export function useRecorder(onRecordingComplete) {
  const [recording, setRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCtxVizRef = useRef(null);
  const vizRAFRef = useRef(null);
  const barsRef = useRef([]);

  useEffect(() => {
    return () => {
      if (vizRAFRef.current) cancelAnimationFrame(vizRAFRef.current);
      if (audioCtxVizRef.current) audioCtxVizRef.current.close().catch(() => {});
    };
  }, []);

  const startViz = (stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioCtxVizRef.current = new AudioCtx();
    const src = audioCtxVizRef.current.createMediaStreamSource(stream);
    const analyser = audioCtxVizRef.current.createAnalyser();
    analyser.fftSize = 64;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const v = data[i % data.length] || 0;
        bar.style.height = Math.max(4, (v / 255) * 26) + 'px';
      });
      vizRAFRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopViz = () => {
    if (vizRAFRef.current) cancelAnimationFrame(vizRAFRef.current);
    barsRef.current.forEach((bar) => { if (bar) bar.style.height = '4px'; });
    if (audioCtxVizRef.current) audioCtxVizRef.current.close().catch(() => {});
  };

  const startRecording = (stream) => {
    audioChunksRef.current = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await onRecordingComplete(blob);
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
    startViz(stream);
  };

  const stopRecording = () => {
    setRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopViz();
  };

  const handleSealClick = useCallback(async (onMicBlocked) => {
    if (recording) { stopRecording(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startRecording(stream);
    } catch (err) {
      onMicBlocked?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  return { recording, barsRef, handleSealClick };
}
