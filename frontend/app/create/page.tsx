"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { fundBountyTransaction } from "@/utils/soroban";
import { db } from "@/utils/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function CreateBountyPage() {
  const router = useRouter();
  const { address, kit, connect, disconnect } = useWallet();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    repo: "",
    description: "",
    asset: "XLM",
    amount: "",
    level: "Beginner",
    deadlineDays: "7",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      await connect();
      return;
    }

    setIsSubmitting(true);
    setTxStatus("BUILDING AND SIGNING ESCROW TRANSACTION...");

    try {
      // Generate a random numeric ID for the new bounty
      const newBountyId = Math.floor(Math.random() * 10000) + 1;
      
      const amountInStroops = (parseInt(formData.amount) || 0) * 10000000;

      const result = await fundBountyTransaction(
        kit,
        address,
        newBountyId,
        "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", // Mock token address
        amountInStroops
      );

      // Save to Firebase Firestore
      const newBounty = {
        id: `SORO-${newBountyId}`,
        title: formData.title,
        repo: formData.repo,
        description: formData.description,
        rewardAmount: formData.amount,
        asset: formData.asset,
        level: formData.level,
        deadlineDays: parseInt(formData.deadlineDays) || 7,
        category: "Community Bounty", // Default category
        applicants: 0,
        applicantList: [],
        funder: address,
        createdAt: new Date().toISOString(),
        status: "open",
      };

      await setDoc(doc(db, "bounties", newBounty.id), newBounty);

      setTxStatus("SUCCESS! BOUNTY CREATED & FUNDED.");
      if (result.hash) {
        setTxHash(result.hash);
      } else {
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Creation error:", err);
      setTxStatus(`ERROR: ${err?.message || "Failed to create bounty"}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#000000] text-zinc-100 flex flex-col relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <span className="font-semibold text-xl tracking-tight text-white">SoroHub</span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <span onClick={() => router.push("/")} className="hover:text-white cursor-pointer transition-colors">Overview</span>
            <span onClick={() => router.push("/dashboard")} className="hover:text-white cursor-pointer transition-colors">Bounties</span>
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
                className="text-xs font-medium text-zinc-300 hover:text-red-400 transition-colors border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={() => connect().catch(console.error)} className="bg-white text-black font-semibold text-sm px-4 py-2 rounded-full hover:bg-slate-200 transition-colors">
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Form Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10 w-full flex-1 flex flex-col">
        
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
          <span className="hover:text-zinc-300 cursor-pointer transition-colors" onClick={() => router.push("/dashboard")}>Dashboard</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-zinc-300">Create Bounty</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Create New Bounty</h1>
          <p className="text-sm text-zinc-300">Fund an open-source issue and let the SoroHub escrow handle the payouts.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Bounty Title</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Implement Soroban SAC Token Swap"
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">GitHub Repository</label>
              <input 
                type="text" 
                required
                placeholder="e.g. sorohub/core-contracts"
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                value={formData.repo}
                onChange={(e) => setFormData({...formData, repo: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Difficulty Level</label>
              <select 
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300">Deadline (Days)</label>
              <input 
                type="number" 
                required
                min="1"
                placeholder="e.g. 7"
                className="bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                value={formData.deadlineDays}
                onChange={(e) => setFormData({...formData, deadlineDays: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <textarea 
              required
              rows={4}
              placeholder="Describe the issue, requirements, and acceptance criteria..."
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-indigo-300">Escrow Asset</label>
              <select 
                className="bg-black/50 border border-indigo-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                value={formData.asset}
                onChange={(e) => setFormData({...formData, asset: e.target.value})}
              >
                <option value="XLM">Stellar (XLM)</option>
                <option value="USDC">USD Coin (USDC)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-indigo-300">Reward Amount</label>
              <div className="relative">
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="e.g. 1500"
                  className="w-full bg-black/50 border border-indigo-500/20 rounded-lg pl-4 pr-16 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 pointer-events-none">
                  {formData.asset}
                </div>
              </div>
            </div>
          </div>

          {txStatus && !txHash && (
            <div className={`text-xs font-medium px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-center border ${
              txStatus.includes("ERROR") 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            }`}>
              {isSubmitting && <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
              {txStatus}
            </div>
          )}

          {txHash && (
            <div className="mt-4 p-6 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-indigo-400 font-semibold mb-1">Bounty Funded!</h3>
                <p className="text-xs text-zinc-300 break-all bg-black/30 p-2 rounded border border-white/5 font-mono">
                  Tx: {txHash}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {!txHash && (
            <button 
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                "Processing Transaction..."
              ) : !address ? (
                "Connect Wallet to Create"
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Fund Bounty & Lock Escrow
                </>
              )}
            </button>
          )}
          
        </form>
      </main>
    </div>
  );
}
