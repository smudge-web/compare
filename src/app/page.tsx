"use client";

import { useState } from "react";

type ComparisonResult = {
  summary: string;
  aspects: {
    name: string;
    itemA: string;
    itemB: string;
  }[];
  prosA: string[];
  consA: string[];
  prosB: string[];
  consB: string[];
  verdict: string;
  funTitle: string;
};

type Tone = "serious" | "balanced" | "chaotic";

export default function HomePage() {
  const [itemA, setItemA] = useState("");
  const [itemB, setItemB] = useState("");
  const [criteria, setCriteria] = useState("");
  const [tone, setTone] = useState<Tone>("balanced");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!itemA.trim() || !itemB.trim()) {
      setError("Please fill in both items.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemA,
          itemB,
          criteria: criteria || undefined,
          tone,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unexpected error");
      }

      const data = (await res.json()) as ComparisonResult;
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl py-10">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-2">
            CompareAnything
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Tell us what you care about, we&apos;ll tell you what wins.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 md:grid-cols-2 mb-8"
        >
          <div className="space-y-4 md:col-span-1">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Thing A
              </label>
              <textarea
                value={itemA}
                onChange={(e) => setItemA(e.target.value)}
                placeholder="e.g. A 2012 Toyota Corolla with 150,000km..."
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none focus:ring focus:ring-gray-500 min-h-[120px] resize-vertical"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                What do you care about? (optional)
              </label>
              <textarea
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="e.g. long-term reliability, running costs, resale value..."
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none focus:ring focus:ring-gray-500 min-h-[90px] resize-vertical"
              />
            </div>
          </div>

          <div className="space-y-4 md:col-span-1">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Thing B
              </label>
              <textarea
                value={itemB}
                onChange={(e) => setItemB(e.target.value)}
                placeholder="e.g. A 2017 Mazda 3 with 90,000km..."
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none focus:ring focus:ring-gray-500 min-h-[120px] resize-vertical"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Humour level
              </label>
              <div className="flex gap-2 text-xs">
                {(["serious", "balanced", "chaotic"] as Tone[]).map((level) => {
                  const isActive = tone === level;
                  const label =
                    level === "serious"
                      ? "Serious"
                      : level === "balanced"
                      ? "Balanced"
                      : "Chaotic";

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setTone(level)}
                      className={`flex-1 rounded-full px-3 py-2 border text-center transition ${
                        isActive
                          ? "border-white bg-white/10"
                          : "border-gray-700 bg-gray-900 hover:border-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full px-5 py-2 text-sm font-medium bg-white text-black hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? "Comparing..." : "Compare"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {result && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                Verdict
              </p>
              <h2 className="text-xl font-semibold mb-2">
                {result.funTitle || "Comparison result"}
              </h2>
              <p className="text-sm text-gray-200 mb-3">{result.summary}</p>
              <p className="text-sm font-medium text-gray-100">
                {result.verdict}
              </p>
            </div>

            {result.aspects?.length > 0 && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 overflow-x-auto">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                  Key aspects
                </p>
                <table className="w-full text-sm border-collapse min-w-[320px]">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-800">
                      <th className="py-2 pr-3">Aspect</th>
                      <th className="py-2 px-3">Thing A</th>
                      <th className="py-2 pl-3">Thing B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.aspects.map((aspect, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-800/60 align-top"
                      >
                        <td className="py-2 pr-3 text-gray-200">
                          {aspect.name}
                        </td>
                        <td className="py-2 px-3 text-gray-300">
                          {aspect.itemA}
                        </td>
                        <td className="py-2 pl-3 text-gray-300">
                          {aspect.itemB}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-100">
                  Thing A – pros
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {result.prosA?.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
                <h3 className="text-sm font-semibold mt-4 mb-2 text-gray-100">
                  Thing A – cons
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {result.consA?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
                <h3 className="text-sm font-semibold mb-2 text-gray-100">
                  Thing B – pros
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {result.prosB?.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
                <h3 className="text-sm font-semibold mt-4 mb-2 text-gray-100">
                  Thing B – cons
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {result.consB?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {!result && !error && (
          <p className="text-xs text-gray-500 mt-4">
            Try: “A new iPhone vs keeping my current Android” or “Living in
            Wellington vs moving to Christchurch”.
          </p>
        )}
      </div>
    </main>
  );
}
