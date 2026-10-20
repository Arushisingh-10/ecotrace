export default function Loading() {
  return (
    <div className="min-h-screen bg-[#070b17] p-6">
      <div className="mx-auto max-w-[1400px] animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-24 rounded-xl bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-28 rounded-xl bg-white/5" />
          <div className="h-28 rounded-xl bg-white/5" />
          <div className="h-28 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}