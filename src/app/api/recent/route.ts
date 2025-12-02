import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";

type RecentComparisonRow = {
  id: string;
  created_at: string;
  template: string | null;
  tone: string | null;
  criteria: string | null;
  item_a: string | null;
  item_b: string | null;
};

export async function GET() {
  try {
    const { data, error } = await supabaseServerClient
      .from("comparisons")
      .select("id, created_at, template, tone, criteria, item_a, item_b")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Supabase recent error:", error);
      return NextResponse.json(
        { error: "Failed to load recent comparisons" },
        { status: 500 }
      );
    }

    return NextResponse.json(data as RecentComparisonRow[]);
  } catch (err) {
    console.error("Recent API error:", err);
    return NextResponse.json(
      { error: "Something went wrong while loading recents" },
      { status: 500 }
    );
  }
}
