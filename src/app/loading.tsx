export default function Loading() {
  return (
    <main className="flex h-screen w-screen items-center justify-center bg-obsidian">
      <div className="animate-pulse text-center">
        <div className="mx-auto mb-4 h-10 w-64 rounded bg-star-white/10" />
        <div className="mx-auto mb-4 h-5 w-48 rounded bg-star-white/10" />
        <div className="space-y-2">
          <div className="mx-auto h-4 w-40 rounded bg-star-white/10" />
          <div className="mx-auto h-4 w-36 rounded bg-star-white/10" />
          <div className="mx-auto h-4 w-44 rounded bg-star-white/10" />
          <div className="mx-auto h-4 w-32 rounded bg-star-white/10" />
          <div className="mx-auto h-4 w-40 rounded bg-star-white/10" />
          <div className="mx-auto h-4 w-36 rounded bg-star-white/10" />
        </div>
      </div>
    </main>
  );
}