"use client";

export default function DashboardSummary({ totalBudget, totalSpent, available }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Budget gesamt
        </p>
        <p className="mt-4 text-3xl font-semibold text-slate-950">
          €{totalBudget.toFixed(2)}
        </p>
      </div>
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ausgegeben
        </p>
        <p className="mt-4 text-3xl font-semibold text-slate-950">
          €{totalSpent.toFixed(2)}
        </p>
      </div>
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Noch verfügbar
        </p>
        <p className="mt-4 text-3xl font-semibold text-slate-950">
          €{available.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
