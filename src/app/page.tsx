"use client";

import { useState, useEffect } from "react";

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

type Mode = "basic" | "expert";

type RecentComparison = {
  id: string;
  created_at: string;
  template: string | null;
  tone: string | null;
  criteria: string | null;
  item_a: string | null;
  item_b: string | null;
};

type Tone = "serious" | "balanced" | "chaotic";

type TemplateKey = "generic" | "cars" | "jobs" | "homes" | "quotes";

type TrendingComparison = {
  item_a: string | null;
  item_b: string | null;
  template: string | null;
  count: number;
};

const TEMPLATES: Record<
  TemplateKey,
  {
    label: string;
    description: string;
    thingALabel: string;
    thingBLabel: string;
    exampleA: string;
    exampleB: string;
    criteriaPlaceholder: string;
  }
> = {
  generic: {
    label: "Anything",
    description: "Use this for totally free-form comparisons.",
    thingALabel: "Thing A",
    thingBLabel: "Thing B",
    exampleA: "e.g. A 2010 Toyota Corolla, 200,000km, but full service history...",
    exampleB: "e.g. A 2018 European hatchback, 110,000km, unknown history...",
    criteriaPlaceholder:
      "e.g. long-term reliability, running costs, resale value...",
  },
  cars: {
    label: "Cars",
    description:
      "Comparing used cars, trims, or different models for purchase.",
    thingALabel: "Car A",
    thingBLabel: "Car B",
    exampleA:
      "2010 Toyota Corolla, 200,000km, full service history, NZ-new, 1.8L petrol, basic trim.",
    exampleB:
      "2017 Mazda 3, 110,000km, partial service history, imported, 2.0L petrol, higher trim.",
    criteriaPlaceholder:
      "Budget, reliability, fuel economy, safety, insurance, comfort, resale value...",
  },
  jobs: {
    label: "Jobs",
    description:
      "Comparing job offers, promotions, or career paths.",
    thingALabel: "Job offer A",
    thingBLabel: "Job offer B",
    exampleA:
      "Permanent BA role at Govt agency, Wellington CBD, hybrid, $110k base, strong job security.",
    exampleB:
      "Contract role at private consultancy, remote, $140/hr, 6-month initial term, high pressure.",
    criteriaPlaceholder:
      "Salary, job security, learning, progression, stress level, commute, remote vs office...",
  },
  homes: {
    label: "Homes",
    description:
      "Comparing houses, rentals, or locations to live.",
    thingALabel: "Home / location A",
    thingBLabel: "Home / location B",
    exampleA:
      "3-bed house in Wellington suburb, older place but insulated, small section, close to schools.",
    exampleB:
      "2-bed apartment in CBD, modern, body corp fees, walkable to everything, limited parking.",
    criteriaPlaceholder:
      "Price, commute, space, noise, schools, lifestyle, renovation potential...",
  },
  quotes: {
    label: "Quotes",
    description:
      "Comparing quotes from tradies, vendors, or service providers.",
    thingALabel: "Quote A",
    thingBLabel: "Quote B",
    exampleA:
      "Builder quote: $45k for deck + pergola, mid-range materials, 4-week timeline, good reviews.",
    exampleB:
      "Builder quote: $38k for similar scope, cheaper materials, 6-week timeline, unknown reviews.",
    criteriaPlaceholder:
      "Total cost, quality of materials, timeline, reputation, warranty, hidden extras...",
  },
};

export default function HomePage() {
  const [itemA, setItemA] = useState("");
  const [itemB, setItemB] = useState("");
  const [criteria, setCriteria] = useState("");
  const [tone, setTone] = useState<Tone>("balanced");
  const [templateKey, setTemplateKey] = useState<TemplateKey>("generic");
  const [mode, setMode] = useState<Mode>("basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentComparisons, setRecentComparisons] = useState<RecentComparison[]>([]);
  const [trending, setTrending] = useState<TrendingComparison[]>([]);

  // Load recent comparisons on first render
  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch("/api/recent");
        if (!res.ok) return;
        const data = (await res.json()) as RecentComparison[];
        setRecentComparisons(data);
      } catch (err) {
        console.error("Failed to load recent comparisons:", err);
      }
    }

    loadRecent();
  }, []);

  useEffect(() => {
    async function loadTrending() {
      try {
        const res = await fetch("/api/trending");
        if (!res.ok) return;
        const data = (await res.json()) as TrendingComparison[];
        setTrending(data);
      } catch (err) {
        console.error("Failed to load trending:", err);
      }
    }
    loadTrending();
  }, []);


  const validTemplates: TemplateKey[] = ["generic", "cars", "jobs", "homes", "quotes"];

  function loadFromRecent(rc: RecentComparison) {
    // Set template if recognised
    if (rc.template && validTemplates.includes(rc.template as TemplateKey)) {
      setTemplateKey(rc.template as TemplateKey);
    }

    // Populate the form fields
    setItemA(rc.item_a ?? "");
    setItemB(rc.item_b ?? "");
    setCriteria(rc.criteria ?? "");

    // Set tone if valid
    if (
      rc.tone === "serious" ||
      rc.tone === "balanced" ||
      rc.tone === "chaotic"
    ) {
      setTone(rc.tone as Tone);
    }

    // Clear current result / share state so user re-runs compare
    setResult(null);
    setShareId(null);
    setCopied(false);
  }

   const activeTemplate = TEMPLATES[templateKey];

    function handleSwap() {
      // Swap the two items
      const oldA = itemA;
      const oldB = itemB;

      setItemA(oldB);
      setItemB(oldA);

      // Clear any existing result / share state
      setResult(null);
      setShareId(null);
      setCopied(false);
    }
 
   
   function handleTemplateChange(next: TemplateKey) {
      // Switch which template is active
      setTemplateKey(next);

      // Clear any previous result so the verdict matches the new context
      setResult(null);
      setShareId(null);
      setCopied(false);
    }

    
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setShareId(null);
    setCopied(false);

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
          templateKey,
          mode, // 👈 NEW
        }),
      });


      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unexpected error");
      }

      const data = (await res.json()) as { result: ComparisonResult; id?: string | null };
      setResult(data.result);
      setShareId(data.id ?? null);

    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
    function resetAll() {
      setItemA("");
      setItemB("");
      setCriteria("");
      setTone("balanced");
      setTemplateKey("generic");
      setResult(null);
      setShareId(null);
      setCopied(false);
      setError(null);
    }

  return (
  <main className="min-h-screen bg-black text-white">
    <div className="w-full max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
    {/* LEFT COLUMN */}
    <div className="md:w-80 w-full md:self-start space-y-8">

      {/* Recent Comparisons */}
      {recentComparisons.length > 0 && (
        <aside className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <h2 className="text-lg font-semibold mb-3 text-white">
            Recent Comparisons
          </h2>

          <div className="space-y-3">
            {recentComparisons.map((rc) => (
              <button
                key={rc.id}
                onClick={() => loadFromRecent(rc)}
                className="w-full text-left p-3 bg-neutral-800 hover:bg-neutral-700 
                          border border-neutral-700 rounded-lg transition"
              >
                <div className="text-sm text-gray-400">
                  {new Date(rc.created_at).toLocaleString()}
                </div>

                <div className="text-md font-medium text-white mt-1">
                  {rc.item_a || "?"} vs {rc.item_b || "?"}
                </div>

                {rc.criteria && (
                  <div className="text-sm text-gray-400 mt-1">
                    ({rc.criteria})
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Trending Comparisons */}
      {trending.length > 0 && (
        <aside className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <h2 className="text-lg font-semibold mb-3 text-white">
            Trending Comparisons
          </h2>

          <div className="space-y-3">
            {trending.map((tc, index) => (
              <button
                key={index}
                onClick={() => {
                  if (tc.template) setTemplateKey(tc.template as TemplateKey);
                  setItemA(tc.item_a ?? "");
                  setItemB(tc.item_b ?? "");
                  setCriteria("");
                  setTone("balanced");
                  setResult(null);
                  setShareId(null);
                  setCopied(false);
                }}
                className="w-full text-left p-3 bg-neutral-800 hover:bg-neutral-700 
                          border border-neutral-700 rounded-lg transition"
              >
                <div className="text-md font-medium text-white">
                  {tc.item_a || "?"} vs {tc.item_b || "?"}
                </div>

                {tc.template && (
                  <div className="text-xs text-gray-400 mt-1 capitalize">
                    {tc.template} template
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-1">
                  {tc.count} comparisons
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

    </div>

      {/* RIGHT: Main CompareAnything UI */}
      <div className="flex-1 w-full max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-2">
            CompareAnything
          </h1>
          <p className="text-sm sm:text-base text-gray-300">
            Tell us what you care about, we&apos;ll tell you what wins.
          </p>
        </header>

        {/* Template selector */}
        <section className="mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
            Templates
          </p>
          <div className="flex flex-wrap gap-2 mb-2 text-xs">
            {(Object.keys(TEMPLATES) as TemplateKey[]).map((key) => {
              const t = TEMPLATES[key];
              const isActive = key === templateKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTemplateChange(key)}
                  className={`rounded-full px-3 py-1 border transition ${
                    isActive
                      ? "border-white bg-white/10"
                      : "border-gray-700 bg-gray-900 hover:border-gray-400"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">
            {activeTemplate.description}
          </p>
        </section>

        <form
  onSubmit={handleSubmit}
  className="grid gap-6 md:grid-cols-2 mb-8"
>
  {/* LEFT COLUMN */}
  <div className="space-y-4 md:col-span-1">
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {activeTemplate.thingALabel}
      </label>
      <textarea
        value={itemA}
        onChange={(e) => setItemA(e.target.value)}
        placeholder={activeTemplate.exampleA}
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
        placeholder={activeTemplate.criteriaPlaceholder}
        className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none focus:ring focus:ring-gray-500 min-h-[90px] resize-vertical"
      />
    </div>
  </div>

  {/* RIGHT COLUMN */}
  <div className="space-y-4 md:col-span-1">
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {activeTemplate.thingBLabel}
      </label>
      <textarea
        value={itemB}
        onChange={(e) => setItemB(e.target.value)}
        placeholder={activeTemplate.exampleB}
        className="w-full rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none focus:ring focus:ring-gray-500 min-h-[120px] resize-vertical"
      />
    </div>

    <div>
      {/* Tone */}
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

      {/* Detail level */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Detail level
        </label>
        <div className="flex gap-2 text-xs">
          {(["basic", "expert"] as Mode[]).map((level) => {
            const isActive = mode === level;
            const label = level === "basic" ? "Standard" : "Expert mode";

            return (
              <button
                key={level}
                type="button"
                onClick={() => setMode(level)}
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
        <p className="mt-1 text-[11px] text-gray-500">
          Expert mode gives a deeper breakdown using the same layout.
        </p>
      </div>

      {/* Swap / Reset / Compare */}
      <div className="flex items-center justify-between pt-3">
        {/* Left side: Swap + Reset */}
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={handleSwap}
            className="rounded-full border border-gray-600 px-4 py-2 hover:border-gray-300 transition"
          >
            Swap A/B
          </button>

          <button
            type="button"
            onClick={resetAll}
            className="rounded-full border border-gray-600 px-4 py-2 hover:border-gray-300 transition"
          >
            Reset
          </button>
        </div>

        {/* Right side: Compare */}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full px-5 py-2 text-sm font-medium bg-white text-black hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>
    </div>
  </div>
</form>

{/* Error message */}
{error && (
  <div className="mb-4 rounded-xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-200">
    {error}
  </div>
)}

{/* Result section */}
{result && (
  <section className="space-y-4">
    {/* Verdict card */}
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

    {/* Share link */}
    {shareId && (
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>This comparison has a shareable link.</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/c/${shareId}`;
              navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            className="rounded-full border border-gray-600 px-3 py-1 hover:border-gray-300 transition"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            href={`/c/${shareId}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-gray-600 px-3 py-1 hover:border-gray-300 transition"
          >
            Open page
          </a>
        </div>
      </div>
    )}

    {/* Key aspects table */}
    {result.aspects?.length > 0 && (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 overflow-x-auto">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
          Key aspects
        </p>
        <table className="w-full text-sm border-collapse min-w-[320px]">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-3">Aspect</th>
              <th className="py-2 px-3">{activeTemplate.thingALabel}</th>
              <th className="py-2 pl-3">{activeTemplate.thingBLabel}</th>
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

    {/* Pros / cons lists */}
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-100">
          {activeTemplate.thingALabel} – pros
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          {result.prosA?.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <h3 className="text-sm font-semibold mt-4 mb-2 text-gray-100">
          {activeTemplate.thingALabel} – cons
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          {result.consA?.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-100">
          {activeTemplate.thingBLabel} – pros
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          {result.prosB?.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <h3 className="text-sm font-semibold mt-4 mb-2 text-gray-100">
          {activeTemplate.thingBLabel} – cons
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

{/* Helper text */}
{!result && !error && (
  <p className="text-xs text-gray-500 mt-4">
    Try switching templates – cars, jobs, homes, or quotes – and then
    tweak the examples to match your real decision.
  </p>
)}

      </div>
    </div>
  </main>
);
}
