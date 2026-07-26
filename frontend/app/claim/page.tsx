"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { claimBountyTransaction } from "@/utils/soroban";
import { db } from "@/utils/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function ClaimBountyPage() {
  const router = useRouter();
  const { address, kit, connect } = useWallet();
  
  const [formData, setFormData] = useState({
    bountyId: "",
    developerAddress: "",
    prUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      await connect();
      return;
    }

    setIsSubmitting(true);
    setTxStatus("AUTHORIZING PAYOUT AND MINTING BADGE...");

    try {
      const numericBountyId = parseInt(formData.bountyId.replace(/\D/g, "")) || 0;
      
      // Execute the on-chain claim!
      const result = await claimBountyTransaction(
        kit,
        address, // The Funder (you)
        formData.developerAddress, // The Developer receiving the funds & NFT
        numericBountyId
      );

      // Update Firebase to mark as claimed
      try {
        await updateDoc(doc(db, "bounties", `SORO-${numericBountyId}`), { status: "claimed" });
      } catch (fbErr) {
        console.error("Failed to update Firebase:", fbErr);
      }

      setTxStatus("SUCCESS! FUNDS RELEASED & NFT MINTED.");
      if ((result as any).hash) {
        setTxHash(result.hash);
      } else {
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }

    } catch (err: any) {
      console.error("Claim error:", err);
      setTxStatus(`ERROR: ${err?.message || "Transaction failed"}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#000000] text-zinc-100 flex flex-col relative selection:bg-indigo-500/30">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
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
                className="text-xs font-medium text-zinc-300 hover:text-red-400 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[600px] mx-auto w-full px-6 py-16 relative z-10 flex-1">
        <h1 className="text-3xl font-bold text-white mb-2">Approve Pull Request</h1>
        <p className="text-zinc-300 text-sm mb-10">Release escrowed funds and mint a soulbound badge to the developer who completed the task.</p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#0a0a0a] p-8 rounded-xl border border-zinc-800 shadow-xl">
          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-zinc-300">Bounty ID</label>
            <input
              required
              placeholder="e.g. 5900"
              value={formData.bountyId}
              onChange={(e) => setFormData({ ...formData, bountyId: e.target.value })}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 focus:bg-[#0a0a0a] transition-all text-sm shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-zinc-300">Developer Stellar Address</label>
            <input
              required
              placeholder="GABC..."
              value={formData.developerAddress}
              onChange={(e) => setFormData({ ...formData, developerAddress: e.target.value })}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 focus:bg-[#0a0a0a] transition-all font-mono text-sm shadow-sm"
            />
            <p className="text-[11px] text-zinc-500 font-medium">This address will receive the USDC/XLM and the NFT Badge.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-zinc-300">Merged Pull Request URL</label>
            <input
              required
              type="url"
              placeholder="https://github.com/..."
              value={formData.prUrl}
              onChange={(e) => setFormData({ ...formData, prUrl: e.target.value })}
              className="block w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 focus:bg-[#0a0a0a] transition-all text-sm shadow-sm"
            />
          </div>

          {!txHash && (
            <button
              type="submit"
              disabled={isSubmitting || !address}
              className="flex w-full justify-center rounded-md bg-white text-black py-2.5 px-4 text-sm font-medium hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-colors disabled:opacity-70 shadow-sm mt-6"
            >
              {isSubmitting ? "Approving on Soroban..." : "Approve & Release Funds"}
            </button>
          )}

          {txStatus && !txHash && (
            <div className={`p-4 rounded-lg border text-xs font-mono text-center mt-4 ${
              txStatus.includes("ERROR") 
                ? "bg-red-500/10 border-red-500/20 text-red-400" 
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}>
              {txStatus}
            </div>
          )}

          {txHash && (
            <div className="mt-6 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-emerald-400 font-semibold mb-1">Developer Paid & Badge Minted!</h3>
                <p className="text-xs text-zinc-300 break-all bg-black/30 p-2 rounded border border-white/5 font-mono">
                  Tx: {txHash}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors mt-2"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
