import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { deterministicWeeklyAnalysis } from "@/lib/analysis";
import { geminiAnalyzeWeekly } from "@/lib/gemini";
import type { AnalysisInput } from "@/lib/types";

async function assertAuthenticated(request: NextRequest, input: AnalysisInput) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (Boolean(supabaseUrl) !== Boolean(supabaseAnon)) throw new Error("Supabase configuration is incomplete.");
  if (!supabaseUrl || !supabaseAnon) {
    if (input.consent.provider === "gemini") throw new Error("Gemini cloud analysis requires Supabase authentication.");
    return;
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Authentication required.");
  const supabase = createClient(supabaseUrl, supabaseAnon);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid session.");
}

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as AnalysisInput;
    if (!input?.consent) return NextResponse.json({ error: "Invalid analysis input." }, { status: 400 });
    await assertAuthenticated(request, input);
    if (input.consent.provider === "off") {
      return NextResponse.json(
        deterministicWeeklyAnalysis(input, ["AI provider is off; deterministic analysis was generated for local review only."])
      );
    }
    if (input.consent.provider === "gemini" && !input.consent.allowCloudAnalysis) {
      return NextResponse.json(
        deterministicWeeklyAnalysis(input, ["Cloud consent was not granted; deterministic analysis was used."])
      );
    }
    const result =
      input.consent.provider === "gemini" ? await geminiAnalyzeWeekly(input) : deterministicWeeklyAnalysis(input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze weekly performance.";
    const status = /authentication|required|session/i.test(message) ? 401 : /configuration/i.test(message) ? 503 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
