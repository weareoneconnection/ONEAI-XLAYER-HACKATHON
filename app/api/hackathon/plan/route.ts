import { NextRequest, NextResponse } from "next/server";
import { generateHackathonPlan } from "@/lib/oneai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();
    const walletAddress = body?.walletAddress ? String(body.walletAddress) : undefined;

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Missing prompt" }, { status: 400 });
    }

    const plan = await generateHackathonPlan({ prompt, walletAddress });
    return NextResponse.json({ ok: true, data: plan });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Plan route failed" },
      { status: 500 }
    );
  }
}
