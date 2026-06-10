"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSummary from "./components/DashboardSummary";
import CategoryDonutChart from "./components/CategoryDonutChart";
import CategoryProgressList from "./components/CategoryProgressList";
import SavingsTipsList from "./components/SavingsTipsList";

const COLOR_OPTIONS = [
  "#10b981",
  "#2563eb",
  "#ec4899",
  "#f97316",
  "#8b5cf6",
  "#14b8a6",
  "#facc15",
  "#0f766e",
];

const MONTHS = [
  { value: "2026-01", label: "Januar 2026" },
  { value: "2026-02", label: "Februar 2026" },
  { value: "2026-03", label: "März 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "Mai 2026" },
  { value: "2026-06", label: "Juni 2026" },
  { value: "2026-07", label: "Juli 2026" },
  { value: "2026-08", label: "August 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-10", label: "Oktober 2026" },
  { value: "2026-11", label: "November 2026" },
  { value: "2026-12", label: "Dezember 2026" },
];

const STORAGE_KEYS = {
  categories: "financeflow-categories",
  expenses: "financeflow-monthly-expenses",
  month: "financeflow-selected-month",
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].value);
  const [expensesByMonth, setExpensesByMonth] = useState({});
  const [tips, setTips] = useState([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [tipsError, setTipsError] = useState("");

  useEffect(() => {
    const storedCategories = window.localStorage.getItem(STORAGE_KEYS.categories);
    const storedExpenses = window.localStorage.getItem(STORAGE_KEYS.expenses);
    const storedMonth = window.localStorage.getItem(STORAGE_KEYS.month);

    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories);
        if (Array.isArray(parsed)) {
          setCategories(parsed);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Kategorien:", error);
      }
    }

    if (storedExpenses) {
      try {
        const parsed = JSON.parse(storedExpenses);
        if (parsed && typeof parsed === "object") {
          setExpensesByMonth(parsed);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Ausgaben:", error);
      }
    }

    if (storedMonth && MONTHS.some((month) => month.value === storedMonth)) {
      setSelectedMonth(storedMonth);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expensesByMonth));
  }, [expensesByMonth]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.month, selectedMonth);
  }, [selectedMonth]);

  const currentExpenses = useMemo(
    () => expensesByMonth[selectedMonth] ?? {},
    [expensesByMonth, selectedMonth]
  );

  const totalBudget = useMemo(
    () => categories.reduce((sum, item) => sum + Number(item.budget), 0),
    [categories]
  );

  const totalSpent = useMemo(
    () =>
      categories.reduce(
        (sum, category) => sum + Number(currentExpenses[category.id] || 0),
        0
      ),
    [categories, currentExpenses]
  );

  const availableAmount = useMemo(() => totalBudget - totalSpent, [totalBudget, totalSpent]);

  const donutData = useMemo(
    () =>
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        color: category.color,
        value: Number(currentExpenses[category.id] || 0),
      })),
    [categories, currentExpenses]
  );

  const last3Months = useMemo(() => {
    const currentIndex = MONTHS.findIndex((month) => month.value === selectedMonth);
    const startIndex = Math.max(0, currentIndex - 2);
    return MONTHS.slice(startIndex, currentIndex + 1);
  }, [selectedMonth]);

  const comparisonMatrix = useMemo(() => {
    return categories.map((category) => {
      const row = { categoryId: category.id, name: category.name, budget: Number(category.budget), cells: [] };
      last3Months.forEach((month) => {
        const monthExpenses = expensesByMonth[month.value] ?? {};
        row.cells.push({
          month: month.value,
          spent: Number(monthExpenses[category.id] || 0),
          overBudget: Number(monthExpenses[category.id] || 0) > Number(category.budget),
        });
      });
      return row;
    });
  }, [categories, expensesByMonth, last3Months]);

  const generateTips = async () => {
    if (categories.length === 0) {
      return;
    }

    setIsLoadingTips(true);
    setTipsError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          categories: categories.map((category) => ({
            id: category.id,
            name: category.name,
            budget: Number(category.budget),
            ausgaben: Number(currentExpenses[category.id] || 0),
            color: category.color,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Fehler bei der Analyse");
      }

      setTips(Array.isArray(data.tipps) ? data.tipps : []);
    } catch (error) {
      setTipsError(error?.message ?? "Unbekannter Fehler");
    } finally {
      setIsLoadingTips(false);
    }
  };

  const addCategory = () => {
    const trimmedName = name.trim();
    const numericBudget = Number(budget);
    if (!trimmedName || Number.isNaN(numericBudget) || numericBudget <= 0) {
      return;
    }

    const nextCategory = {
      id: crypto.randomUUID(),
      name: trimmedName,
      budget: numericBudget,
      color,
    };

    setCategories((current) => [nextCategory, ...current]);
    setName("");
    setBudget("");
    setColor(COLOR_OPTIONS[0]);
  };

  const deleteCategory = (id) => {
    setCategories((current) => current.filter((category) => category.id !== id));
    setExpensesByMonth((current) => {
      const next = {};
      Object.entries(current).forEach(([month, monthData]) => {
        if (!monthData || typeof monthData !== "object") {
          next[month] = monthData;
          return;
        }

        const updatedMonth = { ...monthData };
        delete updatedMonth[id];
        next[month] = updatedMonth;
      });
      return next;
    });
  };

  const saveExpense = (categoryId, newValue) => {
    const trimmed = newValue.trim();
    const nextExpenses = { ...expensesByMonth };
    const monthData = { ...(nextExpenses[selectedMonth] ?? {}) };

    if (trimmed === "") {
      delete monthData[categoryId];
    } else {
      const numericValue = Number(trimmed);
      if (Number.isNaN(numericValue) || numericValue < 0) {
        return;
      }
      monthData[categoryId] = numericValue;
    }

    nextExpenses[selectedMonth] = monthData;
    setExpensesByMonth(nextExpenses);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
        <section className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
                FinanceFlow
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Dashboard
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Übersicht über Budget, Ausgaben und Verfügbarkeit. Die Farben folgen deinen Kategorien.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <DashboardSummary
              totalBudget={totalBudget}
              totalSpent={totalSpent}
              available={availableAmount}
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={generateTips}
              disabled={isLoadingTips || categories.length === 0}
              className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoadingTips ? "Spartipps generieren…" : "AI Spartipps generieren"}
            </button>
            {tipsError ? (
              <p className="text-sm text-red-600">Fehler: {tipsError}</p>
            ) : null}
          </div>

          <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-[420px_1fr]">
            <CategoryDonutChart data={donutData} />
            <CategoryProgressList categories={categories} expenses={currentExpenses} />
          </div>
        </section>

        <SavingsTipsList tips={tips} categories={categories} />

        <section className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
                FinanceFlow
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Meine Kategorien
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Lege deine Ausgabenkategorien an, vergebe ein Monatsbudget und wähle eine Farbe. Die Kategorie-Liste wird automatisch im Browser gespeichert.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-5 py-4 text-slate-700 ring-1 ring-slate-200">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                Gesamtbudget
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                €{totalBudget.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Kategorie-Name
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Essen & Trinken"
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Monatsbudget (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    placeholder="149.99"
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">
                    Farbe auswählen
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setColor(option)}
                        className={`h-11 w-11 rounded-full border-2 transition focus:outline-none ${
                          color === option
                            ? "border-slate-950 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: option }}
                        aria-label={`Farbe ${option}`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addCategory}
                  className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                >
                  Kategorie hinzufügen
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-950">
                  Aktuelle Kategorien
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bearbeite oder lösche Kategorien, um dein Budget flexibel zu verwalten.
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                {categories.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                    Keine Kategorien vorhanden. Lege zuerst eine neue Kategorie an.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className="h-12 w-12 rounded-3xl"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <p className="text-lg font-semibold text-slate-950">
                              {category.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              €{Number(category.budget).toFixed(2)} / Monat
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCategory(category.id)}
                          className="self-start rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 sm:self-center"
                        >
                          Löschen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
                Ausgaben diesen Monat
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Monat auswählen
              </h2>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl bg-slate-50 p-5 text-slate-700 ring-1 ring-slate-200 sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-slate-600">
                Monat
              </label>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="min-w-[190px] rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_240px]">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-4">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Ausgabe gesamt
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    €{totalSpent.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                    Monat
                  </p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {MONTHS.find((month) => month.value === selectedMonth)?.label}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-700">
                Tippe die tatsächlichen Ausgaben ein, um den Monat zu verfolgen.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {categories.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                Keine Kategorien vorhanden. Lege zuerst eine Kategorie an, um Ausgaben zu erfassen.
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        className="h-12 w-12 rounded-3xl"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-slate-950 truncate">
                          {category.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          Budget: €{Number(category.budget).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:w-60">
                      <label className="text-sm font-medium text-slate-700">
                        Tatsächlich ausgegeben
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          currentExpenses[category.id] !== undefined
                            ? currentExpenses[category.id]
                            : ""
                        }
                        onChange={(event) =>
                          saveExpense(category.id, event.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
              Letzten 3 Monate im Vergleich
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Ausgaben pro Kategorie
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-left">
              <thead>
                <tr>
                  <th className="rounded-tl-3xl rounded-tr-none bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                    Kategorie
                  </th>
                  {last3Months.map((month) => (
                    <th
                      key={month.value}
                      className="bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                    >
                      {month.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonMatrix.map((row) => (
                  <tr key={row.categoryId} className="border-b border-slate-200">
                    <td className="px-4 py-4 text-sm font-semibold text-slate-950">
                      {row.name}
                    </td>
                    {row.cells.map((cell) => (
                      <td
                        key={`${row.categoryId}-${cell.month}`}
                        className={`px-4 py-4 text-sm ${
                          cell.overBudget ? "bg-red-100 text-red-800" : "bg-white text-slate-700"
                        } rounded-3xl`}
                      >
                        €{cell.spent.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
