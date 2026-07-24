"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { fundBountyTransaction } from "@/utils/soroban";

const BOUNTY_DETAILS: Record<string, {
  title: string;
  repo: string;
  rewardAmount: string;
  asset: "XLM" | "USDC";
  level: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  requirements: string[];
  rules: string[];
  escrowContract: string;
}> = {
  "SORO-101": {
    title: "Implement Soroban SAC Token Swap Interface",
    repo: "stellar/soroban-examples",
    rewardAmount: "1,500",
    asset: "XLM",
    level: "Beginner",
    description: "Create an intuitive Soroban Asset Contract (SAC) token swap interface leveraging Soroban SDK v21. The interface must handle authorization payloads, fee estimations, and event listening seamlessly.",
    requirements: [
      "Fork the repository and create a feature branch `feat/sac-swap-interface`.",
      "Implement client-side transaction builder with custom Soroban auth invoke calls.",
      "Include unit tests achieving >85% code coverage for state transitions.",
      "Submit Pull Request linking to this bounty ID in the body description."
    ],
    rules: [
      "Bounty must be completed within 7 days of initial lock execution.",
      "Code must pass all GitHub Actions CI workflows.",
      "No unverified third-party npm dependencies permitted."
    ],
    escrowContract: "CCX7...K92L (Soroban Escrow)"
  },
  "default": {
    title: "Build Cross-Chain USDC Bridge Adapter",
    repo: "sorohub/core-contracts",
    rewardAmount: "550",
    asset: "USDC",
    level: "Intermediate",
    description: "Architect a robust Rust-based Soroban contract that processes cross-chain USDC transfer attestations and interacts with native Stellar token balances.",
    requirements: [
      "Implement zero-copy state storage for cross-chain message verification.",
      "Provide CLI submission scripts for Testnet testing.",
      "Document API methods in detail with Markdown examples."
    ],
    rules: [
      "Only 1 active lock per developer permitted at a time.",
      "PR must be reviewed and approved by at least 2 maintainers.",
      "Submissions are evaluated on gas optimization and security."
    ],
    escrowContract: "CA88...3M1P (Soroban Escrow)"
  }
};

export default function BountyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bountyId = (params?.id as string)?.toUpperCase() || "SORO-101";

  const [bounty, setBounty] = useState<any>(null);

  useEffect(() => {
    async function loadBounty() {
      try {
        const { db } = await import("@/utils/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        
        const docRef = doc(db, "bounties", bountyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBounty({
            ...BOUNTY_DETAILS["default"],
            ...docSnap.data()
          });
        } else if (BOUNTY_DETAILS[bountyId]) {
          setBounty(BOUNTY_DETAILS[bountyId]);
        } else {
          setBounty({
            ...BOUNTY_DETAILS["default"],
            title: `Bounty #${bountyId}: Soroban Smart Contract Task`,
          });
        }
      } catch (err) {
        console.error("Failed to load from Firebase:", err);
        setBounty(BOUNTY_DETAILS[bountyId] || {
          ...BOUNTY_DETAILS["default"],
          title: `Bounty #${bountyId}: Soroban Smart Contract Task`,
        });
      }
    }
    
    loadBounty();
  }, [bountyId]);

  const { address, kit, connect, disconnect } = useWallet();
  const [isLocking, setIsLocking] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  if (!bounty) return <div className="min-h-screen bg-black" />;

  const handleApply = async () => {
    if (!address) {
      await connect();
      return;
    }

    if (bounty.funder === address) {
      alert("You cannot apply to your own bounty.");
      return;
    }

    if (bounty.applicantList?.includes(address)) {
      alert("You have already applied to this bounty.");
      return;
    }

    setIsLocking(true);
    setTxStatus("SUBMITTING APPLICATION...");

    try {
      const { db } = await import("@/utils/firebase");
      const { doc, updateDoc, arrayUnion } = await import("firebase/firestore");
      
      const docRef = doc(db, "bounties", bounty.id || bountyId);
      await updateDoc(docRef, {
        applicantList: arrayUnion(address),
        applicants: (bounty.applicants || 0) + 1
      });

      setTxStatus("SUCCESS! APPLICATION SUBMITTED.");
      setBounty({
        ...bounty,
        applicantList: [...(bounty.applicantList || []), address],
        applicants: (bounty.applicants || 0) + 1
      });
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err: any) {
      console.error("Application error:", err);
      setTxStatus(`ERROR: ${err?.message || "Failed to apply"}`);
    } finally {
      setIsLocking(false);
    }
  };

  const handleAssign = async (developer: string) => {
    if (!address) return;
    setIsLocking(true);
    setTxStatus("ASSIGNING BOUNTY...");

    try {
      const { assignBountyTransaction } = await import("@/utils/soroban");
      const { db } = await import("@/utils/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      const numericBountyId = parseInt((bounty.id || bountyId).replace(/\D/g, "")) || 1;
      
      const result = await assignBountyTransaction(kit, address, developer, numericBountyId);

      if (result.status === "success") {
        await updateDoc(doc(db, "bounties", bounty.id || bountyId), {
          status: "assigned",
          assignedTo: developer
        });
        setTxStatus("SUCCESS! BOUNTY ASSIGNED.");
        setBounty({ ...bounty, status: "assigned", assignedTo: developer });
        setTimeout(() => setTxStatus(null), 3000);
      }
    } catch (err: any) {
      console.error("Assign error:", err);
      setTxStatus(`ERROR: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#000000] text-zinc-100 flex flex-col relative selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-black text-sm">
              SH
            </div>
            <span className="font-semibold text-lg tracking-tight text-zinc-100 hidden sm:block">SoroHub</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-zinc-400">
            <span className="text-zinc-100 cursor-pointer">Overview</span>
            <span className="hover:text-zinc-200 cursor-pointer transition-colors" onClick={() => router.push("/dashboard")}>Bounties</span>
            <span className="hover:text-zinc-200 cursor-pointer transition-colors">Activity</span>
            <span className="hover:text-zinc-200 cursor-pointer transition-colors">Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-xs font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Soroban Testnet
          </div>

          {address ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full pl-1.5 pr-3 py-1 cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => router.push("/dashboard")}>
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <span className="text-sm font-medium text-zinc-300">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
              </div>
              <button 
                onClick={disconnect}
                className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="bg-zinc-100 text-black font-semibold text-sm px-4 py-2 rounded-full hover:bg-white transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-6 py-8 relative z-10 w-full flex-1">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <span className="hover:text-zinc-300 cursor-pointer transition-colors" onClick={() => router.push("/dashboard")}>Bounties</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-zinc-300 font-mono">Issue #{bountyId}</span>
        </div>

        {/* Bounty Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-md">
                Open for Claims
              </span>
              <span className="text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                {bounty.repo}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-100 tracking-tight mb-4 leading-tight">
              {bounty.title}
            </h1>
          </div>

          <div className="w-full lg:w-80 shrink-0 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Bounty Escrow</span>
            <div className="text-4xl font-semibold text-zinc-100 mb-1 flex items-baseline gap-2">
              {bounty.rewardAmount} <span className="text-base text-zinc-500 font-medium">{bounty.asset}</span>
            </div>
            
            {txStatus && (
              <div className="mb-4 mt-2 text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 w-full text-center">
                {isLocking && <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
                {txStatus}
              </div>
            )}

            {address === bounty.funder ? (
              <div className="mt-6 w-full flex flex-col gap-2 text-left">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Manage Applicants</div>
                {!bounty.applicantList || bounty.applicantList.length === 0 ? (
                  <div className="text-sm text-zinc-500 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 text-center">
                    No applicants yet.
                  </div>
                ) : bounty.status === "assigned" ? (
                  <div className="text-sm bg-indigo-500/10 text-indigo-400 p-3 rounded-lg border border-indigo-500/20 text-center font-medium">
                    Assigned to: {bounty.assignedTo?.slice(0,4)}...{bounty.assignedTo?.slice(-4)}
                  </div>
                ) : (
                  bounty.applicantList.map((app: string) => (
                    <div key={app} className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                      <span className="text-sm font-mono text-zinc-300">{app.slice(0, 4)}...{app.slice(-4)}</span>
                      <button 
                        onClick={() => handleAssign(app)}
                        disabled={isLocking}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <button 
                  className={`mt-6 w-full ${bounty.applicantList?.includes(address || "") ? "bg-zinc-800 text-zinc-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white"} font-medium text-sm px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleApply}
                  disabled={isLocking || bounty.applicantList?.includes(address || "")}
                >
                  {isLocking ? (
                    "Submitting Application..."
                  ) : address ? (
                    bounty.applicantList?.includes(address) ? "Applied" :
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Apply for Bounty
                    </>
                  ) : (
                    "Connect Wallet to Apply"
                  )}
                </button>
                <span className="text-[11px] text-zinc-500 mt-3 font-medium text-center">Smart Contract Interaction Required</span>
              </>
            )}
          </div>
        </div>

        {/* Content Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Context */}
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">Issue Context</h2>
              <div className="text-sm text-zinc-400 space-y-4 leading-relaxed whitespace-pre-wrap">
                {bounty.description}
              </div>
            </section>

            {/* Requirements List */}
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">Technical Requirements</h2>
              <ul className="flex flex-col gap-3">
                {bounty.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50">
                    <svg className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-zinc-300 leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Verification Rules */}
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">Escrow Release Rules</h2>
              <ul className="flex flex-col gap-3">
                {bounty.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50">
                    <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-500 text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm text-zinc-300 leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Meta Information Sidebar */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Category</h3>
                <span className="inline-flex text-sm font-medium text-zinc-300 bg-zinc-800 px-3 py-1 rounded-md">
                  Smart Contract
                </span>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Experience Level</h3>
                <span className="inline-flex text-sm font-medium text-zinc-300 bg-zinc-800 px-3 py-1 rounded-md">
                  {bounty.level}
                </span>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Applicants</h3>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  {bounty.applicants || 0} Developers
                </div>
              </div>
            </div>

            {/* Smart Contract Info */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-3">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Contract Details</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Escrow</span>
                  <span className="text-zinc-300 font-mono text-xs">{bounty.escrowContract.split(" ")[0]}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Oracle</span>
                  <span className="text-zinc-300">GitHub Verified</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500">Network</span>
                  <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Soroban Testnet
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
