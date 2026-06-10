"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export default function CategoryDonutChart({ data }) {
  const chartData = data.filter((category) => category.value > 0);
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ausgaben nach Kategorie
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Die Farben kommen von deinen Kategorien.
        </p>
      </div>
      <div className="h-[320px] min-h-[320px] w-full max-w-full">
        {totalValue > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={3}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`€${Number(value).toFixed(2)}`, "Ausgabe"]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-3xl bg-slate-50 text-center text-slate-500">
            Keine Ausgaben für diesen Monat vorhanden.
          </div>
        )}
      </div>
    </div>
  );
}
