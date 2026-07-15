# Voice Ledger — Vite + React Router + Tailwind

This is the Voice Ledger dashboard, split into clean, single-responsibility files.

## Setup

```bash
npm install
npm run dev
```

Requires `server.py` running locally (see original backend) for actual transcription —
the UI expects a backend at `http://localhost:8000` by default (editable in the app).

## Structure

```
src/
  lib/
    audio.js        WAV encode + resample-to-16kHz decode helpers
    classify.js      Urdu task-keyword classifier + sentence extraction
  hooks/
    useBackend.js    Backend URL + health-check polling
    useLedger.js      Transcript/notes/tasks state + transcription pipeline
    useRecorder.js    MediaRecorder + waveform visualizer
  components/
    layout/
      Sidebar.jsx
      MobileBar.jsx
    recorder/
      RecordSeal.jsx
      AltInputRow.jsx
      BackendRow.jsx
      PastePanel.jsx
      ProgressBar.jsx
      ErrorBox.jsx
    results/
      TranscriptCard.jsx
      ResultsColumns.jsx
      ListItem.jsx
      Toolbar.jsx
  pages/
    Dashboard.jsx     Composes everything above
  App.jsx              react-router-dom route table (currently just "/")
  main.jsx             Entry point, wraps App in <BrowserRouter>
  index.css            Tailwind directives + fonts + small @layer components
```

All logic (WAV encoding, resampling, Urdu keyword classification, recording,
transcription pipeline, notes/tasks CRUD) is ported 1:1 from the original
single-file component — only the organization and styling engine changed
(inline `<style>` CSS → Tailwind utility classes, themed via `tailwind.config.js`).

## Notes

- Colors, fonts, shadows, and radii from the original design are defined as
  custom tokens in `tailwind.config.js` under the `vl` namespace
  (e.g. `bg-vl-amber`, `shadow-vl-lg`, `rounded-vl-md`).
- Two reusable button styles (`.pill-btn`, `.primary-btn`) are defined once in
  `index.css` via `@apply` to avoid repeating the same utility string everywhere.
- Add more pages/routes in `App.jsx` as the app grows.
