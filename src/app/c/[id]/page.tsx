import { supabaseServerClient } from "@/lib/supabaseServer";

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

type ComparisonRow = {
  id: string;
  created_at: string;
  template: string | null;
  tone: string | null;
  criteria: string | null;
  item_a: string | null;
  item_b: string | null;
  result: ComparisonResult;
};

type PageProps = {
  params: { id: string };
};

export default async function ComparisonPage({ params }: PageProps) {
  const { id } = await params;

  console.log("Compare page params:", await params);

  // Guard against missing or bad ID
  if (!id || id === "undefined") {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-xl py-10 text-center">
          <h1 className="text-2xl font-semibold mb-2">Invalid comparison link</h1>
          <p className="text-sm text-gray-400 mb-2">
            The link doesn&apos;t contain a valid comparison ID.
          </p>
          <p className="text-xs text-gray-500">
            ID value: <code>{String(id)}</code>
          </p>
        </div>
      </main>
    );
  }

  // Supabase lookup
  const { data, error } = await supabaseServerClient
    .from("comparisons")
    .select("*")
    .eq("id", id)
    .maybeSingle<ComparisonRow>();

  if (error || !data) {
    console.error("Comparison not found:", error);

    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-xl py-10 text-center">
          <h1 className="text-2xl font-semibold mb-2">Comparison not found</h1>
          <pre className="text-xs text-gray-500 bg-gray-900/70 border border-gray-800 rounded-lg p-3 text-left overflow-x-auto">
{JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const result = data.result;
  const createdDate = new Date(data.created_at);

  const templateLabel = data.template
    ? data.template.charAt(0).toUpperCase() + data.template.slice(1)
    : "Anything";

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-4xl py-10">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-semibold mb-1">
            CompareAnything
          </h1>
          <p className="text-sm text-gray-300">
            Shared comparison · {templateLabel} ·{" "}
            <span className="text-gray-400">
              {createdDate.toLocaleString()}
            </span>
          </p>
        </header>

        <section className="mb-6 space-y-2 text-sm text-gray-300">
          {(data.item_a || data.item_b) && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                  Thing A
                </p>
                <p className="whitespace-pre-line">{data.item_a}</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                  Thing B
                </p>
                <p className="whitespace-pre-line">{data.item_b}</p>
              </div>
            </div>
          )}

          {data.criteria && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                What they cared about
              </p>
              <p className="whitespace-pre-line">{data.criteria}</p>
            </div>
          )}
        </section>

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
      </div>
    </main>
  );
}
