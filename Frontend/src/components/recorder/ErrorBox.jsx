export default function ErrorBox({ message }) {
  return (
    <div className="w-full max-w-[520px] rounded-[10px] border-l-[3px] border-vl-rust bg-vl-rust-soft
      px-4 py-3 text-center text-[13px] leading-relaxed text-vl-rust-dim shadow-vl-xs">
      {message}
    </div>
  );
}
