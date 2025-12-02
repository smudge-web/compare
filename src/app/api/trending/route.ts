import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    // 1. Fetch a large window of recent comparisons
    const { data, error } = await supabaseServerClient
      .from("comparisons")
      .select("item_a, item_b, template")
      .order("created_at", { ascending: false })
      .limit(100); // <-- increase the sample size here

    if (error) {
      console.error("Trending API error:", error);
      return NextResponse.json(
        { error: "Failed to load trending comparisons." },
        { status: 500 }
      );
    }

    if (!data) return NextResponse.json([]);

    // 2. Group + count occurrences
    const trendingMap: Record<
      string,
      { item_a: string | null; item_b: string | null; template: string | null; count: number }
    > = {};

    for (const row of data) {
      const key = `${row.item_a}|||${row.item_b}|||${row.template}`;

      if (!trendingMap[key]) {
        trendingMap[key] = {
          item_a: row.item_a,
          item_b: row.item_b,
          template: row.template,
          count: 0,
        };
      }
      trendingMap[key].count++;
    }

    // 3. Convert to array & sort by count desc
    const trendingArray = Object.values(trendingMap).sort(
      (a, b) => b.count - a.count
    );

    // 4. Only return the top 5 trends
    const topTrends = trendingArray.slice(0, 5);

    return NextResponse.json(topTrends);
  } catch (err) {
    console.error("Unexpected trending API error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
