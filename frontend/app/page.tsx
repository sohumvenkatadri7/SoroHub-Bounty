"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";

export default function LandingPage() {
  const router = useRouter();
  const { address, connect, disconnect } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [bounties, setBounties] = useState<any[]>([]);

  useEffect(() => {
    let unsubscribe: () => void;
    async function fetchBounties() {
      try {
        const { db } = await import("@/utils/firebase");
        const { collection, onSnapshot, query } = await import("firebase/firestore");
        
        const q = query(collection(db, "bounties"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // sort descending by ID
          fetched.sort((a, b) => {
             const numA = parseInt(a.id.replace(/\D/g, "")) || 0;
             const numB = parseInt(b.id.replace(/\D/g, "")) || 0;
             return numB - numA;
          });
          setBounties(fetched);
        });
      } catch (err) {
        console.error("Failed to fetch bounties:", err);
      }
    }
    fetchBounties();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      const success = await connect();
      if (success) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#000000] text-zinc-100 flex flex-col justify-between relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Premium Grid Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Header - Professional */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <span className="font-semibold text-xl tracking-tight text-white">SoroHub</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <span onClick={() => router.push("/")} className="hover:text-white cursor-pointer transition-colors">Overview</span>
            <span onClick={() => router.push("/dashboard")} className="hover:text-white cursor-pointer transition-colors">Bounties</span>
            <span onClick={() => router.push("/#guide")} className="hover:text-white cursor-pointer transition-colors">Guide</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Soroban Testnet
          </div>

          <button
            onClick={address ? () => router.push("/dashboard") : handleConnectWallet}
            disabled={connecting}
            className="bg-white text-black font-semibold text-sm px-5 py-2 rounded-full hover:scale-105 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70 flex items-center gap-2"
          >
            {connecting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Connecting...
              </span>
            ) : address ? (
              `Dashboard (${address.slice(0, 4)}...${address.slice(-4)})`
            ) : "Connect Wallet"}
          </button>
          
          {address && (
            <button
              onClick={disconnect}
              title="Disconnect Wallet"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-[1200px] mx-auto px-6 py-20 sm:py-28 flex-1 flex flex-col items-center text-center relative z-10 w-full">
        
        <div className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-700/50 rounded-full px-4 py-1.5 text-xs font-medium text-zinc-300 mb-8 hover:bg-zinc-800 transition-colors cursor-pointer backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          SoroHub V2 is live on Testnet
          <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-[5rem] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 max-w-5xl leading-[1.1]">
          The trustless bounty protocol for Web3 developers.
        </h1>

        <p className="max-w-2xl text-zinc-300 text-lg sm:text-xl font-medium mb-10 leading-relaxed">
          Merge a pull request. Get paid instantly. SoroHub uses Soroban smart contracts to put open-source bounties on autopilot.
        </p>

        <div className="flex flex-col gap-6 w-full items-center justify-center mb-24 relative z-20">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {address ? (
              <>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="bg-white text-black font-semibold px-8 py-3.5 rounded-full hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105"
                >
                  Go to Dashboard
                </button>
                <button 
                  onClick={() => router.push("/create")}
                  className="bg-white/5 border border-white/10 text-white font-medium px-8 py-3.5 rounded-full hover:bg-white/10 transition-all hover:border-white/20 hover:scale-105"
                >
                  Fund a Bounty
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="bg-white text-black font-semibold px-8 py-3.5 rounded-full hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105"
                >
                  Explore Bounties
                </button>
                <button 
                  onClick={() => router.push("/create")}
                  className="bg-white/5 border border-white/10 text-white font-medium px-8 py-3.5 rounded-full hover:bg-white/10 transition-all hover:border-white/20 hover:scale-105"
                >
                  Fund a Bounty
                </button>
              </>
            )}
          </div>
          
          <button 
            onClick={() => router.push("/#guide")}
            className="text-zinc-300 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors group px-4 py-2"
          >
            <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            How it works
            <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </button>
        </div>

        {/* Live Bounties Section */}
        <div className="w-full max-w-5xl mt-16 mb-10 relative z-20 text-left">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Active Bounties</h2>
            <div 
              onClick={() => router.push("/dashboard")}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold cursor-pointer transition-colors flex items-center gap-1 group"
            >
              View All
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bounties.slice(0, 6).map((bounty, i) => (
              <div 
                key={bounty.id || i}
                onClick={() => router.push(`/bounty/${bounty.id}`)}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-white/[0.04] transition-all cursor-pointer group flex flex-col justify-between min-h-[160px] backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_30px_rgba(99,102,241,0.15)] hover:-translate-y-1"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-medium text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">#{bounty.id}</span>
                    {bounty.status === "open" ? (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded border border-emerald-400/20">Open</span>
                    ) : bounty.status === "completed" ? (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded border border-purple-400/20">Completed</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">In Progress</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {bounty.title}
                  </h3>
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-xs text-zinc-400 truncate">{bounty.repo}</span>
                  </div>
                  <div className="text-lg font-bold text-white flex items-baseline gap-1.5 shrink-0 max-w-[50%]">
                    <span className="truncate" title={bounty.rewardAmount?.toString()}>{bounty.rewardAmount}</span>
                    <span className="text-xs text-zinc-400 font-medium shrink-0">{bounty.asset}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {bounties.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                <svg className="w-10 h-10 text-zinc-600 mb-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <p className="text-zinc-300 font-medium text-sm">Fetching bounties from network...</p>
              </div>
            )}
          </div>
        </div>

        {/* Structured Feature Cards */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left relative z-10 mt-10 md:mt-20">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col hover:bg-[#121214] transition-colors group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-zinc-100 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Trustless Escrows</h3>
            <p className="text-zinc-300 font-normal leading-relaxed text-sm">
              Funds are programmatically locked in Soroban smart contracts. No human intervention needed.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col hover:bg-[#121214] transition-colors group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-zinc-100 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Instant Payouts</h3>
            <p className="text-zinc-300 font-normal leading-relaxed text-sm">
              Receive native XLM or USDC directly to your wallet the moment your PR is merged.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col hover:bg-[#121214] transition-colors group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-zinc-100 group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Soulbound Identity</h3>
            <p className="text-zinc-300 font-normal leading-relaxed text-sm">
              Earn soulbound developer badges for completed bounties to build your on-chain resume.
            </p>
          </div>
        </div>
        
        {/* Step-by-Step Guide Section */}
        <div id="guide" className="w-full mt-32 mb-20 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Step-by-Step Guide</h2>
            <p className="text-zinc-300 max-w-2xl mx-auto text-lg">Whether you are building the future or funding it, SoroHub makes the process trustless and seamless.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            
            {/* For Developers */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors" />
              <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-white">For Developers</h3>
              </div>
              
              <div className="space-y-6 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/5" />
                
                {[
                  { step: "1", title: "Find a Bounty", desc: "Browse open issues on the dashboard and apply with your GitHub." },
                  { step: "2", title: "Get Assigned", desc: "Once assigned, an on-chain WIP Badge is minted to your wallet." },
                  { step: "3", title: "Submit your PR", desc: "Write the code, submit a Pull Request, and paste the link on SoroHub." },
                  { step: "4", title: "Get Paid Instantly", desc: "When the PR is merged, the smart contract automatically releases the XLM/USDC to you." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ring-4 ring-[#0a0a0a]">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-base mb-1">{item.title}</h4>
                      <p className="text-zinc-300 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Funders */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
              <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-white">For Funders</h3>
              </div>
              
              <div className="space-y-6 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/5" />
                
                {[
                  { step: "1", title: "Create a Bounty", desc: "Link a GitHub issue and lock XLM/USDC in the trustless Escrow contract." },
                  { step: "2", title: "Review Applicants", desc: "Review developer profiles (GitHub/Portfolio) and assign the best fit." },
                  { step: "3", title: "Review Code", desc: "Wait for the developer to submit a PR and review the code on GitHub." },
                  { step: "4", title: "Release Escrow", desc: "Click 'Approve' to instantly release the funds and grant them a Completion Badge." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 ring-4 ring-[#0a0a0a]">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-base mb-1">{item.title}</h4>
                      <p className="text-zinc-300 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-8 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-zinc-600">
            © 2026 SoroHub Inc.
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
