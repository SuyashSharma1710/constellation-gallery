import { getPeriods } from "@/lib/data/repository";

export default async function Home() {
  const result = await getPeriods();
  const periods = result.ok ? result.data : [];

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-obsidian">
      <div className="text-center">
        <h1 className="font-cinzel text-4xl text-star-white">
          Constillation Gallery
        </h1>
        <p className="mt-4 font-inter text-lg text-star-white/60">
          {periods.length} art periods loaded
        </p>
        <ul className="mt-6 space-y-2 text-star-white/80">
          {periods.map((period) => (
            <li key={period.id} className="font-inter">
              {period.name} — {period.artists.length} artists
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}