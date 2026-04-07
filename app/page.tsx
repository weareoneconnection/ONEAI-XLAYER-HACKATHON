import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Rocket,
  ShieldCheck,
  TerminalSquare,
  Trophy,
  Zap,
  Orbit,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      {/* 背景 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_35%)]" />
        <div className="absolute left-[-10%] top-[-10%] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-8%] top-[10%] h-[280px] w-[280px] rounded-full bg-zinc-400/5 blur-3xl" />
      </div>

      {/* 主容器（变宽） */}
      <div className="relative mx-auto flex min-h-screen max-w-[1280px] 2xl:max-w-[1440px] flex-col justify-center px-6 py-12">

        {/* 标签 */}
        <div className="flex flex-wrap gap-3">
          <div className="rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-sm text-zinc-200">
            WAOC OneAI Agent OS
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-sm text-zinc-300">
            <Trophy className="mr-2 inline h-4 w-4" />
            XLayer Hackathon
          </div>

          <div className="rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-sm text-zinc-300">
            <Zap className="mr-2 inline h-4 w-4" />
            Intent → Execution → Proof
          </div>
        </div>

        {/* 标题（核心优化） */}
        <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl xl:text-[72px] xl:leading-[1.02]">
          WAOC OneAI Agent OS
          <span className="mt-3 block bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Autonomous Coordination on XLayer
          </span>
        </h1>

        {/* 描述 */}
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
          Turn one sentence into strategy, execution, and verifiable on-chain proof.
        </p>

        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Not AI output. Real execution.
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Open Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>

          <a
            href="https://web3.okx.com/xlayer"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Build on XLayer
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>

        {/* 功能点 */}
        <div className="mt-8 flex flex-wrap gap-2 text-sm text-zinc-300">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
            <Bot className="mr-2 inline h-4 w-4" />
            Agent planning
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
            <TerminalSquare className="mr-2 inline h-4 w-4" />
            Execution runtime
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
            <Orbit className="mr-2 inline h-4 w-4" />
            On-chain proof
          </div>
        </div>

        {/* 卡片 */}
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {[
            {
              icon: Sparkles,
              title: "One Prompt",
              desc: "Input becomes coordination system.",
            },
            {
              icon: Bot,
              title: "Planning",
              desc: "Strategy + missions + actions.",
            },
            {
              icon: TerminalSquare,
              title: "Execution",
              desc: "Runtime + logs + flow.",
            },
            {
              icon: ShieldCheck,
              title: "Proof",
              desc: "On-chain verification.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="mb-3 inline-flex rounded-xl border border-zinc-800 bg-zinc-950 p-2">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="text-sm font-medium">{item.title}</div>
                <p className="mt-1 text-xs text-zinc-400">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Why */}
        <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-3 text-xs text-zinc-500 uppercase tracking-widest">
            Why this wins
          </div>

          <div className="grid gap-3 md:grid-cols-3 text-sm text-zinc-300">
            <div>Real system, not concept</div>
            <div>XLayer integrated as core</div>
            <div>Clear demo loop</div>
          </div>
        </div>
      </div>
    </main>
  );
}