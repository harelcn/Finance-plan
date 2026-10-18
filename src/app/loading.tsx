/** Shown instantly on navigation while the next screen's data loads. */
export default function Loading() {
  const block = "rounded-3xl bg-ink/10 animate-pulse";
  return (
    <div className="space-y-4" aria-busy="true" aria-label="טוען">
      <div className="space-y-3 py-4">
        <div className="h-3 w-24 rounded-full bg-ink/15 animate-pulse" />
        <div className="h-12 w-56 rounded-2xl bg-ink/15 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={`h-20 ${block}`} />
        <div className={`h-20 ${block}`} />
      </div>
      <div className={`h-36 ${block}`} />
      <div className={`h-48 ${block}`} />
    </div>
  );
}
