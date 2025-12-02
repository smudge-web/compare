import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServerClient } from "@/lib/supabaseServer";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Tone = "serious" | "balanced" | "chaotic";
type Mode = "basic" | "expert";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

        const {
        itemA,
        itemB,
        criteria,
        tone,
        templateKey,
        mode,
        } = body as {
        itemA: string;
        itemB: string;
        criteria?: string;
        tone?: Tone;
        templateKey?: string;
        mode?: string;
        };


    if (!itemA || !itemB) {
      return NextResponse.json(
        { error: "Both items are required" },
        { status: 400 }
      );
    }

    const detailMode: Mode = mode === "expert" ? "expert" : "basic";

    const toneInstruction =
      tone === "chaotic"
        ? "Use a playful, slightly unhinged, comedic tone with witty jabs, but stay respectful and not offensive."
        : tone === "balanced"
        ? "Use a friendly, conversational tone with a bit of light humour."
        : "Use a clear, professional tone with minimal humour.";

    const criteriaText = criteria
      ? `The user cares about: ${criteria}. Focus the comparison on those aspects.`
      : "Choose the most relevant aspects to compare based on common sense.";

    const systemPrompt = `
You are CompareAnything, an AI that compares any two things.

You must respond as strict JSON matching this TypeScript type:

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

There are two detail modes:
- "basic": keep things concise and high level (shorter summary, 3–4 aspects, 3–5 bullets per pros/cons).
- "expert": go deeper with more nuance (richer summary, 5–7 aspects where appropriate, more detailed pros/cons),
  but ALWAYS keep the same JSON structure and field names.

Rules:
- Do NOT include backticks or markdown.
- Do NOT add commentary before or after the JSON.
- Make sure the JSON is valid and parseable.
`.trim();


    const userPrompt = `
Compare the following two items.

Detail mode: ${detailMode}

Item A:
${itemA}

Item B:
${itemB}

${criteriaText}

${toneInstruction}
`.trim();


    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI." },
        { status: 500 }
      );
    }

        let parsed: ComparisonResult;
    try {
      parsed = JSON.parse(content) as ComparisonResult;
    } catch (err) {
      console.error("Failed to parse JSON from model:", err, content);
      return NextResponse.json(
        {
          error:
            "AI response could not be parsed. Try again with simpler descriptions.",
        },
        { status: 500 }
      );
    }

    // --- Log comparison to Supabase and capture the id ---
    let comparisonId: string | null = null;

    try {
      const { data, error: insertError } = await supabaseServerClient
        .from("comparisons")
        .insert({
          template: templateKey ?? null,
          tone: tone ?? null,
          criteria: criteria || null,
          item_a: itemA,
          item_b: itemB,
          result: parsed,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
      } else if (data) {
        comparisonId = data.id;
      }
    } catch (dbErr) {
      console.error("Unexpected Supabase error:", dbErr);
    }

    return NextResponse.json({
      result: parsed,
      id: comparisonId,
    });

  } catch (error) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      { error: "Something went wrong while comparing." },
      { status: 500 }
    );
  }
}
