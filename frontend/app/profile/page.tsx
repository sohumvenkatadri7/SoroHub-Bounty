"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { getDeveloperBadges } from "@/utils/soroban";

interface Bounty {
  id: string;
  title: string;
  repo: string;
  rewardAmount: string;
  asset: "XLM" | "USDC";
  level: "Beginner" | "Intermediate" | "Advanced";
  status?: string;
  assignedTo?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { address, kit, connect, disconnect } = useWallet();
  
  const [xlmBalance, setXlmBalance] = useState<string>("0.00");
  const [usdcBalance, setUsdcBalance] = useState<string>("0.00");
  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [wipBadgeCount, setWipBadgeCount] = useState<number>(0);
  const [completedBounties, setCompletedBounties] = useState<Bounty[]>([]);
  const [totalEarned, setTotalEarned] = useState<number>(0);

  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Fetch bounties and profile from Firebase
  useEffect(() => {
    if (!address) return;
    
    async function fetchProfileData() {
      try {
        const { db } = await import("@/utils/firebase");
        const { collection, getDocs, doc, getDoc, query, where } = await import("firebase/firestore");
        
        // Fetch completed bounties for this address
        const q = query(collection(db, "bounties"));
        const snapshot = await getDocs(q);
        const allBounties = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Bounty));
        
        const myCompleted = allBounties.filter(b => b.assignedTo === address && b.status === "completed");
        setCompletedBounties(myCompleted);
        
        const earned = myCompleted.reduce((sum, b) => sum + (parseInt(b.rewardAmount) || 0), 0);
        setTotalEarned(earned);

        // Fetch global profile links
        const profileSnap = await getDoc(doc(db, "users", address));
        if (profileSnap.exists()) {
          setGithub(profileSnap.data().github || "");
          setPortfolio(profileSnap.data().portfolio || "");
          setName(profileSnap.data().name || "");
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      }
    }
    fetchProfileData();
  }, [address]);

  // Fetch Balances and Badges
  useEffect(() => {
    if (!address) return;

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
      } catch (err) {}

      try {
        const badges = await getDeveloperBadges(address);
        setBadgeCount(badges.length);
        
        const { getWipBadges } = await import("@/utils/soroban");
        const wipBadges = await getWipBadges(address);
        setWipBadgeCount(wipBadges.length);
      } catch (err) {}
    }
    
    fetchBalancesAndBadges();
  }, [address]);

  const saveProfile = async () => {
    if (!address) return;
    setIsSaving(true);
    setSaveMsg("");
    try {
      const { db } = await import("@/utils/firebase");
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "users", address), { name, github, portfolio }, { merge: true });
      setSaveMsg("Profile saved successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setSaveMsg("Error saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#000000] text-zinc-100 flex flex-col relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <span className="font-semibold text-xl tracking-tight text-white">SoroHub</span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <span onClick={() => router.push("/")} className="hover:text-white cursor-pointer transition-colors">Overview</span>
            <span onClick={() => router.push("/dashboard")} className="hover:text-white cursor-pointer transition-colors">Bounties</span>
            <span onClick={() => router.push("/profile")} className="text-white cursor-pointer transition-colors">Profile</span>
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
                className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full pl-1.5 pr-3 py-1 cursor-pointer transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]"
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

      <main className="max-w-[900px] mx-auto px-6 py-12 relative z-10 w-full flex-1 flex flex-col gap-10">
        
        {!address ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet to view Profile</h2>
            <button
              onClick={() => connect().catch(console.error)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-8 py-3 rounded-lg transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-8 border-b border-white/10">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                  <div className="w-full h-full bg-[#0a0a0a] rounded-xl flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 mix-blend-overlay"></div>
                    <svg className="w-12 h-12 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                    {name || "Developer Profile"}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span 
                      className="font-mono text-zinc-400 bg-white/5 px-3 py-1 rounded-md text-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                      title="Copy to clipboard"
                      onClick={() => navigator.clipboard.writeText(address || "")}
                    >
                      {address}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-1 rounded-md">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left Column: Settings */}
              <div className="md:col-span-1 flex flex-col gap-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Public Links</h2>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Display Name</label>
                      <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. CryptoDev99"
                        className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">GitHub Profile URL</label>
                      <input 
                        type="url"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="https://github.com/..."
                        className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Portfolio / Twitter URL</label>
                      <input 
                        type="url"
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <button 
                      onClick={saveProfile}
                      disabled={isSaving}
                      className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save Profile"}
                    </button>
                    {saveMsg && <span className="text-xs text-emerald-400 text-center font-medium mt-1">{saveMsg}</span>}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Wallet Balances</h2>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        <span className="text-sm font-medium text-zinc-300">XLM</span>
                      </div>
                      <span className="font-semibold text-white">{xlmBalance}</span>
                    </div>
                    <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-sm font-medium text-zinc-300">USDC</span>
                      </div>
                      <span className="font-semibold text-white">{usdcBalance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Reputation & History */}
              <div className="md:col-span-2 flex flex-col gap-6">
                
                {/* Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)] pointer-events-none"></div>
                    <span className="text-3xl font-bold text-white mb-1 relative z-10">{badgeCount}</span>
                    <span className="text-xs font-medium text-purple-400 uppercase tracking-wider relative z-10 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                      Completed Badges
                    </span>
                  </div>
                  
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)] pointer-events-none"></div>
                    <span className="text-3xl font-bold text-white mb-1 relative z-10">{wipBadgeCount}</span>
                    <span className="text-xs font-medium text-amber-400 uppercase tracking-wider relative z-10 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      WIP Badges
                    </span>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.1)_0%,transparent_70%)] pointer-events-none"></div>
                    <span className="text-3xl font-bold text-white mb-1 relative z-10 flex items-baseline justify-center gap-1">
                      {totalEarned} <span className="text-base text-zinc-500 font-medium">XLM</span>
                    </span>
                    <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider relative z-10">
                      Total Bounty Earnings
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex-1">
                  <h2 className="text-lg font-semibold text-white mb-6">Completed Work</h2>
                  <div className="flex flex-col gap-3">
                    {completedBounties.length > 0 ? (
                      completedBounties.map((b) => (
                        <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => router.push(`/bounty/${b.id}`)}>
                          <div>
                            <h3 className="text-sm font-semibold text-white mb-1">{b.title}</h3>
                            <p className="text-xs text-zinc-500 font-mono">{b.repo}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
                              Paid: {b.rewardAmount} {b.asset}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-black/40 rounded-xl border border-white/5 border-dashed">
                        <svg className="w-8 h-8 text-zinc-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <p className="text-sm text-zinc-400 font-medium">No completed bounties yet.</p>
                        <p className="text-xs text-zinc-600 mt-1">Start contributing to earn badges and rewards.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
