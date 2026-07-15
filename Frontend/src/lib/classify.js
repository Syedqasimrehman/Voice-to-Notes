// Urdu keywords that flag a sentence as an actionable task rather than a note.
export const TASK_KEYWORDS = [
  'کرنا ہے', 'کرنی ہے', 'کرنے ہیں', 'کرنا ہوگا', 'کرنی ہوگی',
  'یاد رکھنا', 'یاد رکھیں', 'یاد رہے', 'یاد دلانا',
  'بھولنا نہیں', 'مت بھولنا', 'بھول نہ جانا',
  'چاہیے', 'ضروری ہے', 'لازمی ہے',
  'لانا ہے', 'لے آنا', 'جانا ہے', 'بھیجنا ہے', 'بھیج دیں', 'بھیجیں',
  'کال کرنی ہے', 'کال کرنا ہے', 'فون کرنا ہے', 'فون کرنی ہے',
  'ملنا ہے', 'خریدنا ہے', 'خرید لانا',
  'مکمل کرنا ہے', 'تیار کرنا ہے', 'جمع کروانا ہے', 'جمع کرانا ہے',
  'دینا ہے', 'لینا ہے', 'پہنچنا ہے', 'پہنچانا ہے',
  'کریں', 'کرو', 'کیجیے', 'کیجئے',
  'تک کرنا', 'ڈیڈلائن',
];

export function classifySentence(s) {
  return TASK_KEYWORDS.some((k) => s.includes(k)) ? 'task' : 'note';
}

// Splits a transcript into sentences and classifies each as a note or task.
export function extractEntries(fullText) {
  const rawSentences = fullText
    .split(/[۔!؟\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const notes = [];
  const tasks = [];
  rawSentences.forEach((s, i) => {
    const entry = { id: 'i' + i + '_' + Date.now(), text: s, done: false };
    if (classifySentence(s) === 'task') tasks.push(entry);
    else notes.push(entry);
  });
  return { notes, tasks };
}
