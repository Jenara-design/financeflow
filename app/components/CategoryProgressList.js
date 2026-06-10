"use client";

function getStatusStyles(progress) {
  if (progress > 100) {
    return {
      track: "bg-red-200",
      fill: "bg-red-600",
      label: "text-red-700",
    };
  }

  if (progress >= 80) {
    return {
      track: "bg-orange-200",
      fill: "bg-orange-500",
      label: "text-orange-700",
    };
  }

  return {
    track: "bg-emerald-200",
    fill: "bg-emerald-600",
    label: "text-emerald-700",
  };
}

export default function CategoryProgressList({ categories, expenses }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Fortschritt nach Kategorie
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Vergleich von Ausgaben zum Monatsbudget.
        </p>
      </div>
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            Lege zuerst Kategorien an, um Fortschritte zu sehen.
          </div>
        ) : (
          categories.map((category) => {
            const spent = Number(expenses[category.id] ?? 0);
            const budget = Number(category.budget || 0);
            const progress = budget > 0 ? (spent / budget) * 100 : 0;
            const styles = getStatusStyles(progress);
            const progressWidth = Math.min(100, Math.max(0, progress));

            return (
              <div key={category.id} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-950">
                      {category.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      €{spent.toFixed(2)} von €{budget.toFixed(2)}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${styles.label}`}>
                    {progress.toFixed(0)}%
                  </p>
                </div>
                <div className={`h-3 rounded-full ${styles.track}`}>
                  <div
                    className={`${styles.fill} h-3 rounded-full`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
