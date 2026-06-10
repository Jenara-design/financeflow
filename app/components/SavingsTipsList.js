"use client";

export default function SavingsTipsList({ tips, categories }) {
  if (!tips || tips.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
          AI Spartipps
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Konkrete Spar-Empfehlungen
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Claude hat die Ausgaben analysiert und gibt dir drei konkrete Spartipps für deine Kategorien.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {tips.slice(0, 3).map((tip, index) => {
          const category = categories.find((item) => item.name === tip.kategorie);
          const borderColor = category?.color || "#10b981";

          return (
            <article
              key={`${tip.kategorie}-${index}`}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              style={{ borderLeftWidth: 6, borderLeftStyle: "solid", borderLeftColor: borderColor }}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                {tip.kategorie}
              </p>
              <p className="mt-3 text-sm text-slate-600">
                {tip.einsparpotenzial}
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-950">
                {tip.empfehlung}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
