import { NextRequest, NextResponse } from "next/server";
import { executeHackathonFlow } from "@/lib/oneclaw";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();
    const walletAddress = body?.walletAddress ? String(body.walletAddress) : undefined;
    const plan = body?.plan;

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Missing prompt" }, { status: 400 });
    }

    if (!plan) {
      return NextResponse.json({ ok: false, error: "Missing plan" }, { status: 400 });
    }

    const result = await executeHackathonFlow({ prompt, walletAddress, plan });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Execute route failed" },
      { status: 500 }
    );
  }
}
