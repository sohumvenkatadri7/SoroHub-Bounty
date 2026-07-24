"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";

export default function LandingPage() {
  const router = useRouter();
  const { address, connect } = useWallet();
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      await connect();
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-400 flex items-center justify-center font-black text-black text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
              SH
            </div>
            <span className="font-semibold text-lg tracking-tight text-white hidden sm:block">SoroHub</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <span className="text-zinc-100 cursor-pointer">Product</span>
            <span className="hover:text-white cursor-pointer transition-colors">Developers</span>
            <span className="hover:text-white cursor-pointer transition-colors">Ecosystem</span>
            <span className="hover:text-white cursor-pointer transition-colors">Documentation</span>
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

        <p className="max-w-2xl text-zinc-400 text-lg sm:text-xl font-medium mb-10 leading-relaxed">
          Merge a pull request. Get paid instantly. SoroHub uses Soroban smart contracts to put open-source bounties on autopilot.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-24 relative z-20">
          <button
            onClick={address ? () => router.push("/dashboard") : handleConnectWallet}
            className="bg-white text-black font-semibold text-base px-8 py-3.5 rounded-full hover:bg-zinc-200 transition-all hover:-translate-y-0.5 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            {address ? "Go to Dashboard" : "Start Contributing"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-white/5 border border-white/10 text-white font-medium text-base px-8 py-3.5 rounded-full hover:bg-white/10 transition-all backdrop-blur-md"
          >
            Explore Bounties
          </button>
        </div>

        {/* Floating UI Hero Graphic */}
        <div className="relative w-full max-w-4xl h-[400px] sm:h-[500px] mt-10 perspective-[1000px] hidden md:block">
          <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          {/* Main Dashboard Mockup */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transform rotate-x-[15deg] scale-100 origin-top opacity-90 backdrop-blur-xl">
            {/* Fake Dashboard Header */}
            <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
              <div className="w-3 h-3 rounded-full bg-rose-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              <div className="ml-4 h-4 w-32 bg-white/5 rounded" />
            </div>
            {/* Fake Dashboard Content */}
            <div className="p-6 grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div className="h-8 w-48 bg-white/10 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-20 w-full bg-white/5 rounded-xl border border-white/5" />
                  <div className="h-20 w-full bg-white/5 rounded-xl border border-white/5" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-32 w-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl" />
                <div className="h-48 w-full bg-white/5 rounded-xl border border-white/5" />
              </div>
            </div>
          </div>

          {/* Floating XLM Payout Card */}
          <div className="absolute top-20 -left-10 bg-[#121214] border border-white/10 rounded-xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transform -rotate-6 animate-float z-20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-black border border-white/10 flex items-center justify-center p-2">
              {/* Stellar Logo */}
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/20Dil/svg" className="w-full h-full text-white">
                <path d="M12 2L2 12l10 10 10-10L12 2zm0 17.5L4.5 12 12 4.5 19.5 12 12 19.5z" fill="currentColor"/>
                <path d="M12 7l-5 5 5 5 5-5-5-5z" fill="currentColor"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs text-zinc-400 font-medium mb-0.5">Bounty Paid</p>
              <p className="text-sm font-bold text-white">+1,500 XLM</p>
            </div>
          </div>

          {/* Floating USDC Escrow Card */}
          <div className="absolute top-40 -right-4 bg-[#121214] border border-white/10 rounded-xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transform rotate-6 animate-float-delayed z-20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#2775CA]/10 flex items-center justify-center p-1.5">
              {/* USDC Logo */}
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#2775CA"/>
                <path d="M19.466 11.2335C18.6186 10.6698 17.4339 10.354 16.0353 10.354C13.0649 10.354 11.239 11.8344 11.239 13.9856C11.239 15.6548 12.3551 16.5147 14.733 17.1593L15.6022 17.3976C17.2023 17.834 17.8082 18.2863 17.8082 19.1411C17.8082 20.1634 16.8227 20.892 15.3409 20.892C13.7381 20.892 12.5938 20.1983 11.7588 19.1444L9.58984 21.0366C10.8711 22.7533 12.822 23.6339 15.2285 23.6339C18.5724 23.6339 20.5731 22.0622 20.5731 19.6459C20.5731 17.897 19.4975 16.9248 17.189 16.3275L16.2081 16.0711C14.7865 15.6983 14.1207 15.2677 14.1207 14.4984C14.1207 13.5932 14.9754 12.9866 16.148 12.9866C17.4262 12.9866 18.3975 13.5049 19.0886 14.3407L21.2828 12.4497C20.7303 11.9547 20.1384 11.5546 19.466 11.2335Z" fill="white"/>
                <path d="M16 27.5C15.2144 27.5 14.562 26.8624 14.562 26.068V23.5137C15.0163 23.597 15.498 23.6427 16 23.6427C16.4952 23.6427 16.9712 23.597 17.419 23.5152V26.068C17.419 26.8624 16.7667 27.5 15.981 27.5H16ZM16 4.5C16.7856 4.5 17.438 5.13757 17.438 5.93196V8.48633C16.9837 8.40305 16.502 8.35732 16 8.35732C15.5048 8.35732 15.0288 8.40305 14.581 8.48481V5.93196C14.581 5.13757 15.2333 4.5 16.019 4.5H16Z" fill="white"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-xs text-zinc-400 font-medium mb-0.5">Escrow Locked</p>
              <p className="text-sm font-bold text-white">550.00 USDC</p>
            </div>
          </div>
        </div>

        {/* Structured Feature Cards */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left relative z-10 mt-10 md:mt-20">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col hover:bg-[#121214] transition-colors group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-zinc-100 group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Trustless Escrows</h3>
            <p className="text-zinc-400 font-normal leading-relaxed text-sm">
              Funds are programmatically locked in Soroban smart contracts. No human intervention needed.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col hover:bg-[#121214] transition-colors group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-zinc-100 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Instant Payouts</h3>
            <p className="text-zinc-400 font-normal leading-relaxed text-sm">
              Receive native XLM or USDC directly to your wallet the moment your PR is merged.
            </p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col hover:bg-[#121214] transition-colors group">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-zinc-100 group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Soulbound Identity</h3>
            <p className="text-zinc-400 font-normal leading-relaxed text-sm">
              Earn soulbound developer badges for completed bounties to build your on-chain resume.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black py-8 relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-zinc-600">
            © 2026 SoroHub Inc.
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
