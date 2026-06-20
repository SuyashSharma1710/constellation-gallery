import { getPeriods } from "@/lib/data/repository";
import type { PeriodConstellation } from "@/lib/data/types";

export default async function Home() {
  const result = await getPeriods();
  const periods: PeriodConstellation[] = result.ok ? result.data : [];

  const error = result.ok ? null : result.error;

  const allArtists = periods.flatMap((p) =>
    p.artists.map((a) => ({ ...a, periodName: p.name }))
  );
  const allArtworks = allArtists.flatMap((a) =>
    a.artworks.map((aw) => ({
      ...aw,
      artistName: a.name,
      artistId: a.id,
    }))
  );

  return (
    <main className="p-4 md:p-8 max-w-screen-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-cinzel)" }}>
        Constillation Gallery — Database Viewer
      </h1>
      <p className="text-neutral-400 mb-8 text-sm">
        {periods.length} periods · {allArtists.length} artists · {allArtworks.length} artworks
        {error && (
          <span className="text-amber-400 ml-2">
            (fallback data — database unavailable)
          </span>
        )}
        {!error && (
          <span className="text-emerald-400 ml-2">
            (live database)
          </span>
        )}
      </p>

      {/* PERIODS TABLE */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: "var(--font-cinzel)" }}>
          Periods
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-800 text-left">
                <th className="p-2 border border-neutral-700">id</th>
                <th className="p-2 border border-neutral-700">name</th>
                <th className="p-2 border border-neutral-700">description</th>
                <th className="p-2 border border-neutral-700">cosmosPosition</th>
                <th className="p-2 border border-neutral-700">galleryModelPath</th>
                <th className="p-2 border border-neutral-700">updatedAt</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-800/50">
                  <td className="p-2 border border-neutral-700 font-mono text-xs">{p.id}</td>
                  <td className="p-2 border border-neutral-700 font-medium">{p.name}</td>
                  <td className="p-2 border border-neutral-700 text-neutral-300 max-w-xs truncate">
                    {p.description}
                  </td>
                  <td className="p-2 border border-neutral-700 font-mono text-xs">
                    ({p.cosmosPosition.x.toFixed(1)}, {p.cosmosPosition.y.toFixed(1)}, {p.cosmosPosition.z.toFixed(1)})
                  </td>
                  <td className="p-2 border border-neutral-700 font-mono text-xs text-neutral-400">
                    {p.galleryModelPath || "—"}
                  </td>
                  <td className="p-2 border border-neutral-700 font-mono text-xs text-neutral-400">
                    —
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ARTISTS TABLE */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: "var(--font-cinzel)" }}>
          Artists
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-800 text-left">
                <th className="p-2 border border-neutral-700">id</th>
                <th className="p-2 border border-neutral-700">name</th>
                <th className="p-2 border border-neutral-700">periodId</th>
                <th className="p-2 border border-neutral-700">period</th>
                <th className="p-2 border border-neutral-700">birthYear</th>
                <th className="p-2 border border-neutral-700">deathYear</th>
                <th className="p-2 border border-neutral-700">portraitUrl</th>
                <th className="p-2 border border-neutral-700">portraitThumbnailUrl</th>
                <th className="p-2 border border-neutral-700">localPosition</th>
                <th className="p-2 border border-neutral-700">artworks</th>
              </tr>
            </thead>
            <tbody>
              {allArtists.map((a) => (
                <tr key={a.id} className="hover:bg-neutral-800/50">
                  <td className="p-2 border border-neutral-700 font-mono text-xs">{a.id}</td>
                  <td className="p-2 border border-neutral-700 font-medium whitespace-nowrap">
                    {a.name}
                  </td>
                  <td className="p-2 border border-neutral-700 font-mono text-xs">
                    {a.id}
                  </td>
                  <td className="p-2 border border-neutral-700">
                    {a.periodName}
                  </td>
                  <td className="p-2 border border-neutral-700">{a.birthYear}</td>
                  <td className="p-2 border border-neutral-700">{a.deathYear}</td>
                  <td className="p-2 border border-neutral-700 max-w-[200px] truncate">
                    {a.portraitUrl ? (
                      <a
                        href={a.portraitUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 underline text-xs"
                      >
                        link
                      </a>
                    ) : "—"}
                  </td>
                  <td className="p-2 border border-neutral-700 max-w-[200px] truncate">
                    {a.portraitThumbnailUrl ? (
                      <a
                        href={a.portraitThumbnailUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 underline text-xs"
                      >
                        link
                      </a>
                    ) : "—"}
                  </td>
                  <td className="p-2 border border-neutral-700 font-mono text-xs">
                    ({a.localPosition.x.toFixed(1)}, {a.localPosition.y.toFixed(1)}, {a.localPosition.z.toFixed(1)})
                  </td>
                  <td className="p-2 border border-neutral-700 text-center">
                    {a.artworks.length}
                  </td>
                </tr>
              ))}
              {allArtists.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-4 text-center text-neutral-500">
                    No artists found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ARTWORKS TABLE */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: "var(--font-cinzel)" }}>
          Artworks
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-800 text-left">
                <th className="p-2 border border-neutral-700">id</th>
                <th className="p-2 border border-neutral-700">title</th>
                <th className="p-2 border border-neutral-700">artistId</th>
                <th className="p-2 border border-neutral-700">artist</th>
                <th className="p-2 border border-neutral-700">year</th>
                <th className="p-2 border border-neutral-700">imageHighResUrl</th>
                <th className="p-2 border border-neutral-700">imageThumbnailUrl</th>
                <th className="p-2 border border-neutral-700">dimensions</th>
                <th className="p-2 border border-neutral-700">aspectRatio</th>
                <th className="p-2 border border-neutral-700">description</th>
              </tr>
            </thead>
            <tbody>
              {allArtworks.map((aw) => (
                <tr key={aw.id} className="hover:bg-neutral-800/50">
                  <td className="p-2 border border-neutral-700 font-mono text-xs">{aw.id}</td>
                  <td className="p-2 border border-neutral-700 font-medium whitespace-nowrap">
                    {aw.title}
                  </td>
                  <td className="p-2 border border-neutral-700 font-mono text-xs">
                    {aw.artistId}
                  </td>
                  <td className="p-2 border border-neutral-700">{aw.artistName}</td>
                  <td className="p-2 border border-neutral-700">{aw.year}</td>
                  <td className="p-2 border border-neutral-700 max-w-[200px] truncate">
                    <a
                      href={aw.imageHighResUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline text-xs"
                    >
                      link
                    </a>
                  </td>
                  <td className="p-2 border border-neutral-700 max-w-[200px] truncate">
                    <a
                      href={aw.imageThumbnailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline text-xs"
                    >
                      link
                    </a>
                  </td>
                  <td className="p-2 border border-neutral-700 font-mono text-xs whitespace-nowrap">
                    {aw.dimensions.width} × {aw.dimensions.height}
                  </td>
                  <td className="p-2 border border-neutral-700 font-mono text-xs">
                    {aw.aspectRatio.toFixed(2)}
                  </td>
                  <td className="p-2 border border-neutral-700 text-neutral-300 max-w-xs">
                    {aw.description}
                  </td>
                </tr>
              ))}
              {allArtworks.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-4 text-center text-neutral-500">
                    No artworks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}