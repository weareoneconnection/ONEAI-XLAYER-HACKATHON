"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  Layers3,
  Loader2,
  Rocket,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Wallet,
  AlertTriangle,
  Trophy,
  Zap,
  Orbit,
  Cpu,
  ChevronRight,
  Brain,
  FileText,
} from "lucide-react";
import { BrowserProvider, Contract, isAddress } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { proofAbi } from "@/lib/xlayer";

declare global {
  interface Window {
    ethereum?: any;
    okxwallet?: any;
    trustwallet?: any;
    phantom?: {
      ethereum?: any;
      solana?: any;
    };
  }
}

type DemoState =
  | "idle"
  | "thinking"
  | "executing"
  | "recording"
  | "done"
  | "error";

type PlanResponse = {
  summary: string;
  tweets: string[];
  missions: string[];
  actions: string[];
  proofLabel: string;
  aiReasoning?: string[];
  rawText?: string;
  rawJson?: unknown;
};

type ExecuteResponse = {
  executed: boolean;
  logs?: string[];
  executionId?: string;
  status?: string;
};

type RecordPayloadResponse = {
  actor: string;
  proofLabel: string;
  summary: string;
  executionId: string;
  proofHash: string;
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

type WalletPickResult = {
  provider: any | null;
  walletName: string;
  blockedReason?: string;
};

const EXAMPLES = [
  "Create a viral campaign and coordinate 1000 users",
  "Launch my project on XLayer",
  "Help me grow WAOC to 10,000 users",
  "Turn my idea into a viral launch campaign",
];

const DEFAULT_PLAN: PlanResponse = {
  summary:
    "WAOC OneAI Agent OS converts your intent into a coordinated launch system. The agent plans the strategy, executes the first actions, and records verifiable proof on XLayer.",
  tweets: [
    "We are not launching a product. We are launching WAOC OneAI Agent OS on XLayer.\n\nFrom intent → execution → on-chain proof.",
    "Turn one sentence into strategy, execution, and verifiable proof with WAOC OneAI Agent OS.",
  ],
  missions: [
    "Publish launch thread and CTA",
    "Open community mission for early users",
    "Reward first wave contributors with verifiable proof",
    "Track conversion and leaderboard momentum",
  ],
  actions: [
    "Generate launch copy",
    "Execute social distribution",
    "Create on-chain mission proof",
    "Update community leaderboard",
  ],
  proofLabel: "Proof of Coordination",
  aiReasoning: [
    "The prompt is converted into a clear launch narrative for judges to understand quickly.",
    "Tweets create visible AI output for the demo.",
    "Mission flow shows community coordination instead of static content generation.",
    "Actions prepare a clean bridge into OneClaw execution and XLayer proof.",
  ],
  rawText:
    "OneAI generated a launch strategy, tweet pack, mission flow, and action graph for the XLayer hackathon demo.",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function readJson<T>(res: Response): Promise<ApiEnvelope<T>> {
  const text = await res.text();

  if (!text) {
    return {
      ok: res.ok,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  }

  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return {
      ok: false,
      error: `Invalid JSON response: ${text.slice(0, 160)}`,
    };
  }
}

export default function XLayerHackathonDemoPage() {
  const [prompt, setPrompt] = useState(
    "Create a viral campaign and coordinate 1000 users",
  );
  const [walletAddress, setWalletAddress] = useState("");
  const [walletName, setWalletName] = useState("");
  const [state, setState] = useState<DemoState>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [error, setError] = useState("");
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [executionId, setExecutionId] = useState("");
  const [explorerUrl, setExplorerUrl] = useState("");
  const [txHash, setTxHash] = useState("");
  const [planData, setPlanData] = useState<PlanResponse>(DEFAULT_PLAN);

  const walletConnected = !!walletAddress;
  const plan = useMemo(() => planData, [planData]);

  const proofContractAddress =
    process.env.NEXT_PUBLIC_PROOF_CONTRACT_ADDRESS || "";

  const XLAYER_CHAIN_ID_HEX =
    process.env.NEXT_PUBLIC_XLAYER_CHAIN_ID_HEX || "0xc4";
  const XLAYER_CHAIN_NAME =
    process.env.NEXT_PUBLIC_XLAYER_CHAIN_NAME || "X Layer mainnet";
  const XLAYER_RPC_URL =
    process.env.NEXT_PUBLIC_XLAYER_RPC_URL || "https://rpc.xlayer.tech";
  const XLAYER_BLOCK_EXPLORER_URL =
    process.env.NEXT_PUBLIC_XLAYER_BLOCK_EXPLORER_URL ||
    "https://www.okx.com/web3/explorer/xlayer";
  const XLAYER_CURRENCY_NAME =
    process.env.NEXT_PUBLIC_XLAYER_CURRENCY_NAME || "OKB";
  const XLAYER_CURRENCY_SYMBOL =
    process.env.NEXT_PUBLIC_XLAYER_CURRENCY_SYMBOL || "OKB";
  const XLAYER_CURRENCY_DECIMALS = Number(
    process.env.NEXT_PUBLIC_XLAYER_CURRENCY_DECIMALS || 18,
  );

  function pushLog(message: string) {
    setExecutionLogs((prev) => {
      if (prev[prev.length - 1] === message) return prev;
      return [...prev, message];
    });
  }

  function getInjectedEvmProviders() {
    if (typeof window === "undefined") return [];

    const providers: any[] = [];

    if (window.okxwallet) {
      providers.push(window.okxwallet);
    }

    if (window.ethereum?.providers && Array.isArray(window.ethereum.providers)) {
      providers.push(...window.ethereum.providers);
    } else if (window.ethereum) {
      providers.push(window.ethereum);
    }

    if (window.phantom?.ethereum) {
      providers.push(window.phantom.ethereum);
    }

    return providers.filter(
      (provider, index, arr) => arr.indexOf(provider) === index,
    );
  }

  function isTrustProvider(provider: any) {
    return !!(
      provider?.isTrust ||
      provider?.isTrustWallet ||
      provider?.__walletName === "Trust Wallet"
    );
  }

  function isPhantomProvider(provider: any) {
    return !!provider?.isPhantom;
  }

  function pickBestEvmProvider(): WalletPickResult {
    const providers = getInjectedEvmProviders();

    const filteredProviders = providers.filter(
      (provider) => !isTrustProvider(provider) && !isPhantomProvider(provider),
    );

    const okxProvider =
      filteredProviders.find(
        (provider) => provider?.isOKExWallet || provider?.isOkxWallet,
      ) || window.okxwallet;

    if (okxProvider) {
      return {
        provider: okxProvider,
        walletName: "OKX Wallet",
      };
    }

    const metaMaskProvider = filteredProviders.find(
      (provider) =>
        provider?.isMetaMask &&
        !provider?.isRabby &&
        !isTrustProvider(provider) &&
        !isPhantomProvider(provider),
    );

    if (metaMaskProvider) {
      return {
        provider: metaMaskProvider,
        walletName: "MetaMask",
      };
    }

    const rabbyProvider = filteredProviders.find((provider) => provider?.isRabby);

    if (rabbyProvider) {
      return {
        provider: rabbyProvider,
        walletName: "Rabby",
      };
    }

    const trustProvider = providers.find((provider) => isTrustProvider(provider));
    if (trustProvider) {
      return {
        provider: null,
        walletName: "Trust Wallet",
        blockedReason:
          "Trust Wallet is not supported for this XLayer demo. Please use OKX Wallet, MetaMask, or Rabby.",
      };
    }

    const phantomProvider = providers.find((provider) => isPhantomProvider(provider));
    if (phantomProvider) {
      return {
        provider: null,
        walletName: "Phantom",
        blockedReason:
          "Phantom is not supported for this XLayer demo. Please use OKX Wallet, MetaMask, or Rabby.",
      };
    }

    if (filteredProviders[0]) {
      return {
        provider: filteredProviders[0],
        walletName: "EVM Wallet",
      };
    }

    return {
      provider: null,
      walletName: "",
      blockedReason:
        "No supported EVM wallet detected. Please install OKX Wallet, MetaMask, or Rabby.",
    };
  }

  async function ensureXLayerNetwork(provider: any) {
    const currentChainId = await provider.request({
      method: "eth_chainId",
    });

    if (String(currentChainId).toLowerCase() === XLAYER_CHAIN_ID_HEX.toLowerCase()) {
      return;
    }

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: XLAYER_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: XLAYER_CHAIN_ID_HEX,
              chainName: XLAYER_CHAIN_NAME,
              nativeCurrency: {
                name: XLAYER_CURRENCY_NAME,
                symbol: XLAYER_CURRENCY_SYMBOL,
                decimals: XLAYER_CURRENCY_DECIMALS,
              },
              rpcUrls: [XLAYER_RPC_URL],
              blockExplorerUrls: [XLAYER_BLOCK_EXPLORER_URL],
            },
          ],
        });
      } else {
        throw new Error("Please switch to XLayer network.");
      }
    }
  }

  const steps = [
    {
      title: "OneAI Planning",
      icon: Bot,
      desc: "AI generates strategy, tweets, missions, action graph, and reasoning.",
    },
    {
      title: "OneClaw Executing",
      icon: TerminalSquare,
      desc: "Agent runtime executes tasks and returns visible task logs.",
    },
    {
      title: "XLayer Proof",
      icon: ShieldCheck,
      desc: "Verifiable proof is recorded on-chain for trust and replayability.",
    },
  ];

  async function connectWallet() {
    setError("");

    try {
      const picked = pickBestEvmProvider();

      if (!picked.provider) {
        throw new Error(
          picked.blockedReason ||
            "No supported EVM wallet detected. Please use OKX Wallet, MetaMask, or Rabby.",
        );
      }

      const accounts = await picked.provider.request({
        method: "eth_requestAccounts",
      });

      const address = Array.isArray(accounts) ? accounts[0] : "";

      if (!address) {
        throw new Error("No wallet address returned.");
      }

      await ensureXLayerNetwork(picked.provider);

      setWalletAddress(address);
      setWalletName(picked.walletName);
      setState((prev) => (prev === "error" ? "idle" : prev));
      pushLog(`Wallet connected: ${picked.walletName}`);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to connect wallet.");
    }
  }

  async function writeProofOnChainWithWallet(input: {
    actor: string;
    proofLabel: string;
    summary: string;
    executionId: string;
    proofHash: string;
  }) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not detected.");
    }

    if (!proofContractAddress) {
      throw new Error("Missing NEXT_PUBLIC_PROOF_CONTRACT_ADDRESS");
    }

    if (!isAddress(proofContractAddress)) {
      throw new Error("Invalid NEXT_PUBLIC_PROOF_CONTRACT_ADDRESS");
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const activeAccount = Array.isArray(accounts) ? accounts[0] : "";
    if (!activeAccount) {
      throw new Error("No wallet account connected.");
    }

    await ensureXLayerNetwork(window.ethereum);

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    if (
      input.actor &&
      signerAddress.toLowerCase() !== input.actor.toLowerCase()
    ) {
      throw new Error("Connected wallet does not match the actor address.");
    }

    const contract = new Contract(proofContractAddress, proofAbi, signer);

    const tx = await contract.recordProof(
      signerAddress,
      input.proofLabel,
      input.summary,
      input.executionId || `exec_${Date.now()}`,
      input.proofHash,
    );

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction failed on-chain.");
    }

    return {
      txHash: tx.hash,
      recordId: receipt.hash || tx.hash,
      explorerUrl: `${XLAYER_BLOCK_EXPLORER_URL}/tx/${tx.hash}`,
    };
  }

  async function runDemo() {
    setError("");
    setExecutionLogs([]);
    setExecutionId("");
    setExplorerUrl("");
    setTxHash("");

    try {
      setState("thinking");
      setStepIndex(0);

      pushLog("OneAI plan started");
      pushLog("Analyzing prompt intent");
      pushLog("Generating strategy, tweets, missions, action graph, and reasoning");

      const planRes = await fetch("/api/hackathon/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          walletAddress: walletAddress || undefined,
          mode: "xlayer_hackathon_demo",
        }),
      });

      const planJson = await readJson<PlanResponse>(planRes);
      if (!planRes.ok || !planJson.ok || !planJson.data) {
        throw new Error(planJson.error || "Failed to generate OneAI plan.");
      }

      setPlanData(planJson.data);
      pushLog("OneAI plan generated successfully");

      setState("executing");
      setStepIndex(1);

      pushLog("OneClaw execution started");
      pushLog("Preparing execution workflow");
      pushLog("Running launch actions");

      const executeRes = await fetch("/api/hackathon/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          walletAddress: walletAddress || undefined,
          plan: planJson.data,
        }),
      });

      const executeJson = await readJson<ExecuteResponse>(executeRes);
      if (!executeRes.ok || !executeJson.ok || !executeJson.data?.executed) {
        throw new Error(executeJson.error || "Failed to execute OneClaw flow.");
      }

      const executeData = executeJson.data;
      const executeLogs = executeData.logs ?? [];

      setExecutionId(executeData.executionId || "");

      pushLog(
        executeData.executionId
          ? `Execution ID created: ${executeData.executionId}`
          : "Execution flow completed",
      );

      if (executeLogs.length > 0) {
        setExecutionLogs((prev) => [...prev, ...executeLogs]);
      } else {
        pushLog("Launch assets prepared");
        pushLog("Mission flow assembled");
        pushLog("Proof payload requested");
      }

      setState("recording");
      setStepIndex(2);

      pushLog("Preparing XLayer proof payload");

      const recordRes = await fetch("/api/hackathon/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          walletAddress: walletAddress || undefined,
          executionId: executeData.executionId,
          proofLabel: planJson.data.proofLabel,
          summary: planJson.data.summary,
        }),
      });

      const recordJson = await readJson<RecordPayloadResponse>(recordRes);
      if (!recordRes.ok || !recordJson.ok || !recordJson.data) {
        throw new Error(recordJson.error || "Failed to prepare XLayer proof.");
      }

      pushLog("Proof payload ready");
      pushLog("Submitting proof transaction to XLayer");

      const onchain = await writeProofOnChainWithWallet(recordJson.data);

      setTxHash(onchain.txHash);
      setExplorerUrl(onchain.explorerUrl || "");
      setState("done");

      pushLog(`Transaction submitted: ${onchain.txHash}`);
      pushLog("On-chain proof recorded successfully");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Demo run failed.");
      pushLog(
        err instanceof Error ? `Execution failed: ${err.message}` : "Execution failed",
      );
    }
  }

  async function copyHash() {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function copyRawOutput() {
    if (!plan.rawText) return;
    await navigator.clipboard.writeText(plan.rawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 1200);
  }

  const running =
    state === "thinking" || state === "executing" || state === "recording";

  const statusLabel = {
    idle: "Ready to run",
    thinking: "OneAI is generating the plan",
    executing: "OneClaw is executing tasks",
    recording: "XLayer proof is being recorded",
    done: "Proof successfully recorded",
    error: "Execution failed",
  }[state];

  const aiStatusLabel = {
    idle: "Waiting for prompt",
    thinking: "Generating strategy, tweets, missions, actions, and reasoning",
    executing: "Plan generated",
    recording: "Plan locked and proof preparing",
    done: "Plan executed successfully",
    error: "Plan generation interrupted",
  }[state];

  const mainActionLabel = {
    idle: "Run Autonomous Coordination",
    thinking: "Thinking",
    executing: "Executing",
    recording: "Recording",
    done: "Run Again",
    error: "Retry Demo",
  }[state];

  const executionTimeline = [
    {
      label: "OneAI Plan",
      desc: "Generate strategy, tweets, missions, action graph, and reasoning",
      active: state === "thinking",
      done: state === "executing" || state === "recording" || state === "done",
    },
    {
      label: "OneClaw Execute",
      desc: "Run workflow and return visible execution logs",
      active: state === "executing",
      done: state === "recording" || state === "done",
    },
    {
      label: "XLayer Proof",
      desc: "Prepare proof payload and submit on-chain transaction",
      active: state === "recording",
      done: state === "done",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[360px] w-[360px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[260px] w-[260px] rounded-full bg-zinc-400/5 blur-3xl" />
        <div className="absolute bottom-[-8%] left-[20%] h-[220px] w-[220px] rounded-full bg-zinc-300/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 2xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-200 sm:text-sm">
              WAOC OneAI Agent OS
            </Badge>
            <Badge className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300 sm:text-sm">
              <Trophy className="mr-1 h-3.5 w-3.5" />
              Demo-ready
            </Badge>
            <Badge className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300 sm:text-sm">
              <Zap className="mr-1 h-3.5 w-3.5" />
              Intent → Execution → Proof
            </Badge>
          </div>

          <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.08fr)_minmax(400px,500px)] 2xl:items-start">
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="max-w-[860px] text-[clamp(2.35rem,5vw,4.9rem)] font-semibold leading-[1.02] tracking-tight">
                  WAOC OneAI Agent OS
                  <span className="mt-3 block bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                    Turn Ideas Into On-Chain Execution
                  </span>
                </h1>

                <div className="max-w-2xl space-y-3">
                  <p className="text-base leading-7 text-zinc-300 md:text-lg">
                    Turn one sentence into strategy, execution, and verifiable proof.
                  </p>

                  <p className="text-sm leading-7 text-zinc-400 md:text-base">
                    Not AI output. Real execution.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 text-sm text-zinc-300">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
                  <Bot className="mr-2 inline h-4 w-4" />
                  Agent planning
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
                  <Cpu className="mr-2 inline h-4 w-4" />
                  Execution runtime
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
                  <Orbit className="mr-2 inline h-4 w-4" />
                  On-chain proof
                </div>
              </div>
            </div>

            <div className="2xl:pt-3">
              <div className="w-full rounded-[28px] border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur">
                <div className="mb-4 text-sm text-zinc-500">Command Center</div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Wallet
                        </div>
                        <div className="mt-1 truncate font-mono text-sm text-zinc-200">
                          {walletConnected
                            ? `${walletName || "Wallet"} · ${walletAddress}`
                            : "Not connected"}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="h-10 rounded-xl border-zinc-700 bg-zinc-900 px-4 text-zinc-100 hover:bg-zinc-800"
                        onClick={connectWallet}
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        {walletConnected ? "Reconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="h-11 w-full rounded-2xl bg-gradient-to-r from-white to-zinc-300 text-sm font-semibold tracking-wide text-black shadow-[0_0_30px_rgba(255,255,255,0.12)] transition hover:scale-[1.01] hover:bg-zinc-200"
                    onClick={runDemo}
                    disabled={running}
                  >
                    {running ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="mr-2 h-4 w-4" />
                    )}
                    {mainActionLabel}
                    {!running ? <ChevronRight className="ml-2 h-4 w-4" /> : null}
                  </Button>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      Flow
                    </div>
                    <div className="mt-2 text-sm font-medium text-zinc-200">
                      OneAI Plan → OneClaw Execute → XLayer Proof
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "OneAI", active: state === "thinking" },
                      { label: "OneClaw", active: state === "executing" },
                      { label: "XLayer", active: state === "recording" || state === "done" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-center text-xs font-medium transition",
                          item.active
                            ? "border-white/20 bg-white/10 text-white shadow-[0_0_18px_rgba(255,255,255,0.08)]"
                            : "border-zinc-800 bg-zinc-950 text-zinc-500",
                        )}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs leading-6 text-zinc-500">
                    Supported: OKX Wallet, MetaMask, Rabby.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>{error}</div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.02fr)_minmax(400px,0.98fr)]">
          <div className="space-y-6">
            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/20 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[1.7rem]">
                  <Sparkles className="h-5 w-5" />
                  One Sentence → Autonomous Launch
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <Input
                    value={prompt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPrompt(e.target.value)
                    }
                    placeholder="Describe your goal..."
                    className="h-13 rounded-2xl border-zinc-800 bg-zinc-950 px-5 text-base text-white placeholder:text-zinc-500 md:text-lg"
                  />
                  <Button
                    className="h-13 rounded-2xl bg-white px-6 text-base font-semibold text-black hover:bg-zinc-200 lg:min-w-[152px]"
                    onClick={runDemo}
                    disabled={running}
                  >
                    Execute
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((item) => (
                    <button
                      key={item}
                      onClick={() => setPrompt(item)}
                      className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                  <span className="text-zinc-500">Prompt sent to OneAI:</span>{" "}
                  {prompt}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                  <span className="text-zinc-500">AI Output:</span> {aiStatusLabel}
                </div>

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-300">
                  <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
                    <Flame className="h-4 w-4" />
                    Core Narrative
                  </div>
                  <p className="leading-7 text-zinc-200">{plan.summary}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-3">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const active = i === stepIndex && running;
                const completed = state === "done" || i < stepIndex;

                return (
                  <Card
                    key={step.title}
                    className={cn(
                      "rounded-[24px] border bg-zinc-900/70",
                      active || completed ? "border-white/30" : "border-zinc-800",
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                          <Icon className="h-5 w-5" />
                        </div>

                        {completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        ) : active ? (
                          <Loader2 className="h-5 w-5 animate-spin text-zinc-300" />
                        ) : null}
                      </div>

                      <div className="text-base font-medium">{step.title}</div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {step.desc}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/70">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-[1.7rem]">
                  <Layers3 className="h-5 w-5" />
                  OneAI Generated Plan
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                  <span className="text-zinc-500">Generated from prompt:</span>{" "}
                  Strategy, AI tweet outputs, mission plan, action graph, reasoning, and raw text.
                </div>

                {plan.aiReasoning?.length ? (
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
                      <Brain className="h-4 w-4" />
                      OneAI Reasoning
                    </div>

                    <div className="space-y-2.5">
                      {plan.aiReasoning.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-sm leading-6 text-zinc-200"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {plan.rawText ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                        <FileText className="h-4 w-4" />
                        OneAI Raw Output
                      </div>

                      <Button
                        variant="outline"
                        className="rounded-xl border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                        onClick={copyRawOutput}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copiedRaw ? "Copied" : "Copy Raw"}
                      </Button>
                    </div>

                    <div className="whitespace-pre-wrap rounded-3xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-200">
                      {plan.rawText}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="mb-3 text-sm font-medium text-zinc-400">
                        AI Tweet Outputs
                      </div>

                      <div className="space-y-3">
                        {plan.tweets.map((tweet, index) => (
                          <div
                            key={index}
                            className="whitespace-pre-wrap rounded-3xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-200"
                          >
                            {tweet}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-3 text-sm font-medium text-zinc-400">
                        AI Mission Plan
                      </div>

                      <div className="space-y-2">
                        {plan.missions.map((mission, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200"
                          >
                            <Badge className="mt-0.5 rounded-full bg-white px-2 py-1 text-black">
                              {index + 1}
                            </Badge>
                            <span>{mission}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-zinc-800" />

                    <div>
                      <div className="mb-3 text-sm font-medium text-zinc-400">
                        AI Action Graph
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {plan.actions.map((action) => (
                          <Badge
                            key={action}
                            className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200"
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {plan.rawJson ? (
                  <details className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <summary className="cursor-pointer text-sm text-zinc-400">
                      View raw JSON payload
                    </summary>
                    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-zinc-300">
                      {JSON.stringify(plan.rawJson, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-[1.7rem]">Execution & Proof Panel</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-3xl border border-zinc-800 bg-black/40 p-5">
                  <div className="mb-2 text-sm text-zinc-500">Status</div>
                  <div className="text-xl font-semibold sm:text-2xl">{statusLabel}</div>

                  {state === "done" && (
                    <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-300">
                      Coordination successfully executed on XLayer
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-3 text-sm text-zinc-500">Execution Timeline</div>
                  <div className="space-y-3">
                    {executionTimeline.map((item, index) => (
                      <div
                        key={item.label}
                        className={cn(
                          "rounded-2xl border p-4",
                          item.active
                            ? "border-white/20 bg-white/5"
                            : item.done
                              ? "border-green-500/20 bg-green-500/5"
                              : "border-zinc-800 bg-black/20",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                              item.done
                                ? "bg-green-500/20 text-green-300"
                                : item.active
                                  ? "bg-white/10 text-white"
                                  : "bg-zinc-800 text-zinc-400",
                            )}
                          >
                            {item.done ? "✓" : index + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="text-sm font-medium text-zinc-100">
                              {item.label}
                            </div>
                            <div className="mt-1 text-xs leading-6 text-zinc-400">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="text-sm text-zinc-500">Network</div>
                    <div className="mt-1 text-base font-medium">XLayer</div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="text-sm text-zinc-500">Proof Type</div>
                    <div className="mt-1 text-base font-medium">{plan.proofLabel}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 text-sm text-zinc-500">Wallet</div>
                  <div className="break-all font-mono text-sm text-zinc-200">
                    {walletConnected
                      ? `${walletName || "Wallet"} · ${walletAddress}`
                      : "Not connected"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 text-sm text-zinc-500">Execution ID</div>
                  <div className="break-all font-mono text-sm text-zinc-200">
                    {executionId || "Waiting for execution..."}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 text-sm text-zinc-500">Transaction Hash</div>
                  <div className="break-all font-mono text-sm text-zinc-200">
                    {txHash || "Waiting for on-chain proof..."}
                  </div>

                  {txHash && (
                    <div className="mt-3 text-xs text-zinc-500">
                      Verified on-chain. Immutable record.
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                      onClick={copyHash}
                      disabled={!txHash}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copied ? "Copied" : "Copy Hash"}
                    </Button>

                    <a
                      href={explorerUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(!explorerUrl && "pointer-events-none")}
                    >
                      <Button
                        variant="outline"
                        className="rounded-2xl border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                        disabled={!explorerUrl}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Explorer
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-3 text-sm text-zinc-500">OneClaw Execution Logs</div>
                  <div className="space-y-2">
                    {executionLogs.length ? (
                      executionLogs.map((log, index) => (
                        <div
                          key={`${log}-${index}`}
                          className="rounded-xl border border-zinc-800 bg-black/30 p-3 font-mono text-xs leading-6 text-zinc-300"
                        >
                          {log}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm text-zinc-500">
                        No execution logs yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
                  Visible demo loop: prompt → OneAI reasoning + plan → OneClaw execution → XLayer proof.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-zinc-800 bg-zinc-900/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-[1.7rem]">Why This Can Win</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm leading-7 text-zinc-300">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="font-medium text-white">
                    1. One sentence becomes a visible system.
                  </span>
                  <br />
                  Judges can see AI reasoning, structured planning, agent execution, and proof in one flow.
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="font-medium text-white">
                    2. XLayer is part of the product, not decoration.
                  </span>
                  <br />
                  On-chain proof makes the execution verifiable and demo-worthy.
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="font-medium text-white">
                    3. The demo has a real AI-driven wow moment.
                  </span>
                  <br />
                  Prompt → reasoning → plan → execution logs → tx hash is exactly the loop judges remember.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}