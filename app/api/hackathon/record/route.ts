import { NextRequest, NextResponse } from "next/server";
import { buildProofHash } from "@/lib/xlayer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const prompt = String(body?.prompt || "").trim();
    const walletAddress = body?.walletAddress ? String(body.walletAddress) : "";
    const executionId = body?.executionId ? String(body.executionId) : "";
    const proofLabel = String(body?.proofLabel || "Proof of Coordination");
    const summary = String(body?.summary || "Autonomous coordination on X Layer");

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Missing prompt" }, { status: 400 });
    }

    if (!walletAddress) {
      return NextResponse.json({ ok: false, error: "Missing walletAddress" }, { status: 400 });
    }

    const proofHash = buildProofHash({
      prompt,
      summary,
      executionId,
    });

    return NextResponse.json({
      ok: true,
      data: {
        actor: walletAddress,
        proofLabel,
        summary,
        executionId,
        proofHash,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Record route failed",
      },
      { status: 500 },
    );
  }
}