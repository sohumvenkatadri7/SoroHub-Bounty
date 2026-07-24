"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { getDeveloperBadges, claimBountyTransaction } from "@/utils/soroban";

interface Bounty {
  id: string;
  title: string;
  repo: string;
  rewardAmount: string;
  asset: "XLM" | "USDC";
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  applicants: number;
  applicantList?: string[];
  funder?: string;
  status?: string;
  assignedTo?: string;
}

const MOCK_BOUNTIES: Bounty[] = [];

export default function DashboardPage() {
  const router = useRouter();
  const { address, kit, connect, disconnect } = useWallet();
  const [activeTab, setActiveTab] = useState<"All" | "Beginner" | "Intermediate" | "Advanced" | "My Work" | "Manage">("All");
  
  const [xlmBalance, setXlmBalance] = useState<string>("0.00");
  const [usdcBalance, setUsdcBalance] = useState<string>("0.00");
  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [bounties, setBounties] = useState<Bounty[]>([]);

  // Fetch bounties from Firebase (Real-time)
  useEffect(() => {
    let unsubscribe: () => void;
    async function fetchBounties() {
      try {
        const { db } = await import("@/utils/firebase");
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        
        const q = query(collection(db, "bounties"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bounty));
          setBounties(fetched);
        });
      } catch (err) {
        console.error("Failed to fetch bounties from Firebase:", err);
      }
    }
    fetchBounties();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch Balances and Badges
  useEffect(() => {
    if (!address) {
      setXlmBalance("0.00");
      setUsdcBalance("0.00");
      setBadgeCount(0);
      return;
    }

    async function fetchBalancesAndBadges() {
      try {
        const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
        if (res.ok) {
          const data = await res.json();
          const native = data.balances.find((b: any) => b.asset_type === "native");
          if (native) {
            setXlmBalance(parseFloat(native.balance).toLocaleString("en-US", { maximumFractionDigits: 2 }));
          }

          const usdc = data.balances.find((b: any) => b.asset_code === "USDC");
          if (usdc) {
            setUsdcBalance(parseFloat(usdc.balance).toLocaleString("en-US", { maximumFractionDigits: 2 }));
          } else {
            setUsdcBalance("0.00");
          }
        }
      } catch (err) {
        console.error("Failed to fetch Horizon balances:", err);
      }

      try {
        const badges = await getDeveloperBadges(address as string);
        setBadgeCount(badges.length);
      } catch (err) {
        console.error("Failed to fetch badges:", err);
      }
    }
    
    fetchBalancesAndBadges();
  }, [address]);

  const handleAssign = async (bounty: Bounty, developer: string) => {
    if (!address) {
      alert("Please connect wallet");
      return;
    }
    try {
      const { assignBountyTransaction } = await import("@/utils/soroban");
      const { db } = await import("@/utils/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      const numericBountyId = parseInt(bounty.id.replace(/\D/g, "")) || 1;
      
      const result = await assignBountyTransaction(
        kit,
        address,
        developer,
        numericBountyId
      );

      if (result.status === "success") {
        await updateDoc(doc(db, "bounties", bounty.id), {
          status: "assigned",
          assignedTo: developer
        });
        
        const { setDoc, arrayUnion } = await import("firebase/firestore");
        await setDoc(doc(db, "users", developer), {
          notifications: arrayUnion({
            id: Date.now().toString(),
            message: `You were assigned to: ${bounty.title}`,
            link: `/bounty/${bounty.id}`,
            read: false,
            timestamp: new Date().toISOString()
          })
        }, { merge: true });
        alert(`Bounty assigned successfully! Tx: ${result.hash}`);
      }
    } catch (err: any) {
      console.error("Assign error:", err);
      alert(`Error assigning: ${err.message}`);
    }
  };

  const filteredBounties = activeTab === "Manage" 
    ? bounties.filter(b => b.funder === address)
    : activeTab === "My Work"
      ? bounties.filter(b => b.assignedTo === address || b.applicantList?.includes(address || ""))
      : activeTab === "All"
        ? bounties.filter(b => b.status === "open")
        : bounties.filter(b => b.status === "open" && b.level === activeTab);

  // Generate real contribution activity data
  const chartData = useMemo(() => {
    const data = Array(30).fill(0);
    if (!address) return data;
    const now = new Date();
    
    bounties.forEach(b => {
      // Check if user is involved (funder, assigned, or applied)
      const involved = b.funder === address || b.assignedTo === address || b.applicantList?.includes(address);
      if (involved && (b as any).createdAt) {
        const d = new Date((b as any).createdAt);
        const diffDays = Math.floor(Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
          const index = 29 - diffDays;
          if (index >= 0 && index < 30) {
            data[index] += 1;
          }
        }
      }
    });
    return data;
  }, [bounties, address]);

  return (
    <div className="min-h-screen font-sans bg-[#000000] text-zinc-100 flex flex-col relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header - Professional */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <span className="font-semibold text-xl tracking-tight text-white">SoroHub</span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <span onClick={() => router.push("/")} className="hover:text-white cursor-pointer transition-colors">Overview</span>
            <span onClick={() => router.push("/dashboard")} className="text-white cursor-pointer transition-colors">Bounties</span>
            <span onClick={() => router.push("/profile")} className="hover:text-white cursor-pointer transition-colors">Profile</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Soroban Testnet
          </div>

          {address ? (
            <div className="flex items-center gap-3">
              <div 
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full pl-1.5 pr-3 py-1 cursor-pointer hover:bg-white/20 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <span className="text-sm font-medium text-white">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
              </div>
              <button 
                onClick={disconnect}
                className="text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect().catch(console.error)}
              className="bg-white text-black font-semibold text-sm px-4 py-2 rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {address ? (
        <main className="max-w-[1200px] mx-auto px-6 py-8 relative z-10 w-full flex-1 flex flex-col gap-8">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Dashboard</h1>
              <p className="text-sm text-zinc-400">Manage your bounties, track payouts, and view your on-chain reputation.</p>
            </div>
            
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <button 
                onClick={() => router.push("/create")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Fund a Bounty
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col hover:bg-white/[0.04] transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full pointer-events-none" />
              <span className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Total Earned
              </span>
              <div className="text-2xl font-bold text-white mb-1 flex items-baseline gap-2">
                {bounties.filter(b => b.status === "completed").reduce((sum, b) => sum + (parseInt(b.rewardAmount) || 0), 0)} <span className="text-sm text-zinc-500 font-medium">XLM</span>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col hover:bg-white/[0.04] transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />
              <span className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Wallet Balances
              </span>
              <div className="flex flex-col gap-1 relative z-10">
                <div className="flex justify-between items-end">
                  <span className="text-xl font-bold text-white">{xlmBalance}</span>
                  <span className="text-xs font-medium text-emerald-400 mb-0.5">XLM</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xl font-bold text-white">{usdcBalance}</span>
                  <span className="text-xs font-medium text-blue-400 mb-0.5">USDC</span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col hover:bg-white/[0.04] transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />
              <span className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Completed Issues
              </span>
              <div className="text-2xl font-bold text-white mb-2 relative z-10">
                {bounties.filter(b => b.status === "completed").length}
              </div>
              <div className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded w-fit relative z-10">
                {bounties.filter(b => b.status === "assigned").length} Pending Review
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col hover:bg-white/[0.04] transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />
              <span className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                Soulbound Badges
              </span>
              <div className="text-2xl font-bold text-white mb-2 relative z-10">{badgeCount}</div>
              <div className="text-[10px] font-semibold text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-0.5 rounded w-fit relative z-10">
                Verified On-Chain
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Bounties & Activity */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Bounties List */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">Open Bounties</h2>
                  <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                    {(address 
                      ? ["All", "Beginner", "Intermediate", "Advanced", "My Work", "Manage"] 
                      : ["All", "Beginner", "Intermediate", "Advanced"]
                    ).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          activeTab === tab
                            ? "bg-white text-black shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-[200px]">
                  {filteredBounties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-zinc-600">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        {activeTab === "My Work" ? "No Active Work" : activeTab === "Manage" ? "No Managed Bounties" : "No Active Bounties"}
                      </h3>
                      <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
                        {activeTab === "My Work" 
                          ? "You haven't applied to or been assigned any bounties yet. Browse open issues to get started!" 
                          : activeTab === "Manage" 
                            ? "You haven't created any bounties yet. Fund an open-source issue to see it here."
                            : "There are currently no open bounties matching this filter. Be the first to fund an open-source issue and kick off the ecosystem!"}
                      </p>
                      {activeTab !== "My Work" && (
                        <button 
                          onClick={() => router.push("/create")}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        >
                          Create Your First Bounty
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredBounties.map((bounty, i) => (
                      <div
                        key={bounty.id}
                        className={`p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-white/[0.04] transition-colors ${
                          i !== filteredBounties.length - 1 ? 'border-b border-white/5' : ''
                        }`}
                      >
                        <div 
                          className="flex flex-col gap-1.5 cursor-pointer group"
                          onClick={() => router.push(`/bounty/${bounty.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-medium text-zinc-500 bg-white/5 px-2 py-0.5 rounded">#{bounty.id}</span>
                            <span className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">{bounty.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-medium">
                            <span className="text-zinc-400">{bounty.repo}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-emerald-400">{bounty.level}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-purple-400">{bounty.category}</span>
                            {bounty.status === "open" && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded border border-emerald-400/20 ml-2">Open</span>
                            )}
                            {bounty.status === "assigned" && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded border border-blue-400/20 ml-2">In Progress</span>
                            )}
                            {bounty.status === "in_review" && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20 ml-2">In Review</span>
                            )}
                            {bounty.status === "completed" && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded border border-purple-400/20 ml-2">Completed</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-3">
                          <div className="flex items-center gap-6 sm:justify-end cursor-pointer" onClick={() => router.push(`/bounty/${bounty.id}`)}>
                            <div className="flex flex-col sm:items-end gap-1">
                              <span className="text-sm font-bold text-white">
                                {bounty.rewardAmount} <span className="text-zinc-500">{bounty.asset}</span>
                              </span>
                              <span className="text-xs text-zinc-500">{bounty.applicants || 0} applicants</span>
                            </div>
                            <div className="hidden sm:flex text-zinc-500 hover:text-indigo-400 hover:translate-x-1 transition-all">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                          </div>

                          {activeTab === "Manage" && (
                            <div className="mt-2 flex flex-col gap-2 w-full max-w-xs">
                              {bounty.status === "open" && bounty.applicantList && bounty.applicantList.length > 0 && (
                                <div className="text-xs text-zinc-400">
                                  <div className="font-semibold text-zinc-300 mb-2">Applicants:</div>
                                  {bounty.applicantList.map((app) => {
                                    const profile = bounty.applicantProfiles?.[app] || {};
                                    return (
                                      <div key={app} className="flex flex-col bg-black/50 p-2 rounded border border-white/5 mb-1 gap-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono">{app.slice(0, 4)}...{app.slice(-4)}</span>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleAssign(bounty, app); }}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded text-[10px] uppercase font-bold"
                                          >
                                            Assign
                                          </button>
                                        </div>
                                        {(profile.github || profile.portfolio) && (
                                          <div className="flex items-center gap-2 text-[10px] border-t border-white/5 pt-1 mt-0.5">
                                            {profile.github && (
                                              <a href={profile.github} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-zinc-400 hover:text-white flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                                                GitHub
                                              </a>
                                            )}
                                            {profile.portfolio && (
                                              <a href={profile.portfolio} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-zinc-400 hover:text-white flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                Portfolio
                                              </a>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {(bounty.status === "assigned" || bounty.status === "in_review") && (
                                <div className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-2 rounded border border-indigo-500/20 text-center font-medium">
                                  {bounty.status === "in_review" ? "PR in Review: " : "Assigned to: "}{bounty.assignedTo?.slice(0,4)}...{bounty.assignedTo?.slice(-4)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: System Logs & Recent Activity */}
            <div className="flex flex-col gap-8">
              
              {/* Activity Chart Placeholder */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h2 className="text-base font-semibold text-white">Activity</h2>
                  <select className="bg-white/5 border border-white/10 text-white text-[10px] font-medium rounded-md px-2 py-1 outline-none hover:bg-white/10 transition-colors">
                    <option>30 Days</option>
                  </select>
                </div>
                <div className="h-24 w-full flex items-end gap-1 pb-2 border-b border-white/10 relative z-10">
                  {chartData.map((val, i) => {
                    const maxVal = Math.max(...chartData, 1);
                    const height = val === 0 ? 2 : Math.max(15, (val / maxVal) * 100);
                    const isToday = i === 29;
                    return (
                      <div 
                        key={i} 
                        title={val > 0 ? `${val} contributions` : "No contributions"}
                        className={`flex-1 rounded-t-sm ${isToday ? 'bg-gradient-to-t from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : val > 0 ? 'bg-indigo-400' : 'bg-white/5 hover:bg-white/10'} transition-all duration-300`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-medium text-zinc-500 relative z-10">
                  <span>Jul 1</span>
                  <span>Jul 15</span>
                  <span>Jul 30</span>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-6">Recent Activity</h2>
                <div className="flex flex-col gap-6">
                  {bounties.slice(0, 3).map((b) => (
                    <div key={`activity-${b.id}`} className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        b.status === "completed" 
                          ? "bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                          : b.status === "assigned" 
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                            : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)]"
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                            b.status === "completed" ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            : b.status === "assigned" ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                            : "M5 13l4 4L19 7"
                          } />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {b.status === "completed" ? "Bounty Completed" : b.status === "assigned" ? "Bounty Assigned" : "Bounty Created"}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{b.title}</p>
                        <p className="text-xs font-medium text-emerald-400 mt-2">{b.rewardAmount} {b.asset}</p>
                      </div>
                    </div>
                  ))}
                  {bounties.length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-4">No recent activity yet.</p>
                  )}
                </div>
              </div>

              {/* System Log */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex-1">
                <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2">
                  System Log
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse ml-auto" />
                </h2>
                
                <div className="flex flex-col gap-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-[1px] before:bg-white/10">
                  <div className="relative pl-10">
                    <div className="absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-[#0a0a0a]" />
                    <p className="text-sm font-semibold text-white">Wallet Connected</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Session initialized</p>
                  </div>
                  
                  <div className="relative pl-10">
                    <div className="absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-400 ring-4 ring-[#0a0a0a]" />
                    <p className="text-sm font-semibold text-white">Passport Verified</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Badges loaded for {address.slice(0, 4)}...{address.slice(-4)}</p>
                  </div>

                  <div className="relative pl-10">
                    <div className="absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-[#0a0a0a]" />
                    <p className="text-sm font-semibold text-white">Balances Synced</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Horizon RPC connected</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-6 py-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="text-center mb-12 max-w-lg mx-auto relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-3xl flex items-center justify-center mx-auto mb-8 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
              Connect your wallet
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Sign in with your Stellar wallet to view your developer passport, track your payouts, and apply for open bounties.
            </p>
            <button
              onClick={connect}
              className="mt-10 bg-white text-black font-semibold text-base px-8 py-3.5 rounded-full hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
            >
              Connect Wallet
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
