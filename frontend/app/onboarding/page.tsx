"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { db } from "@/utils/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function OnboardingPage() {
  const { address, disconnect } = useWallet();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [github, setGithub] = useState("");

  useEffect(() => {
    async function checkRegistration() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const { db } = await import("@/utils/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        const docSnap = await getDoc(doc(db, "users", address));

        if (docSnap.exists()) {
          router.push("/dashboard");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Check registration error:", err);
        setLoading(false);
      }
    }

    checkRegistration();
  }, [address, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !name || !email || !github) return;

    setSubmitting(true);
    try {
      const { db } = await import("@/utils/firebase");
      const { doc, setDoc } = await import("firebase/firestore");
      
      await setDoc(doc(db, "users", address), {
        name,
        email,
        github,
        createdAt: new Date().toISOString()
      }, { merge: true });

      router.push("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      alert("Failed to save profile. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black relative selection:bg-zinc-800">
      
      {/* Background Elements - Minimalist */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-zinc-900/30 blur-[120px] rounded-full" />
      </div>

      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-3 cursor-pointer group z-20" onClick={() => router.push("/")}>
        <span className="font-semibold text-xl tracking-tight text-white">SoroHub</span>
      </div>

      <div className="w-full max-w-3xl flex flex-col md:flex-row bg-[#0a0a0a] rounded-xl border border-zinc-800 shadow-xl relative z-10 overflow-hidden">
        
        {/* Left Side: Visual / Brand */}
        <div className="md:w-5/12 bg-zinc-950 p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-800">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mb-6 text-zinc-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white leading-tight">
              Developer Profile
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Mint your identity. Solve open-source issues. Earn crypto and verified soulbound badges.
            </p>
          </div>

          <div className="mt-12 md:mt-0 relative z-10">
            <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <div className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5 font-medium">Connected Wallet</div>
              <div className="text-sm font-mono text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connecting...'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-7/12 p-8 sm:p-10">
          <form className="space-y-6 h-full flex flex-col justify-center" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="group">
                <label className="block text-[13px] font-medium text-zinc-300 mb-1.5 transition-colors">Developer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full bg-zinc-900 border border-zinc-800 py-2.5 px-3 text-white placeholder-zinc-600 focus:border-zinc-400 focus:bg-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-zinc-400 sm:text-sm transition-all rounded-md shadow-sm"
                  placeholder="Satoshi Nakamoto"
                />
              </div>

              <div className="group">
                <label className="block text-[13px] font-medium text-zinc-300 mb-1.5 transition-colors">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-zinc-900 border border-zinc-800 py-2.5 px-3 text-white placeholder-zinc-600 focus:border-zinc-400 focus:bg-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-zinc-400 sm:text-sm transition-all rounded-md shadow-sm"
                  placeholder="satoshi@stellar.org"
                />
              </div>

              <div className="group">
                <label className="block text-[13px] font-medium text-zinc-300 mb-1.5 transition-colors">GitHub URL</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-zinc-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
                  </span>
                  <input
                    type="url"
                    required
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="block w-full bg-zinc-900 border border-zinc-800 py-2.5 pl-9 pr-3 text-white placeholder-zinc-600 focus:border-zinc-400 focus:bg-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-zinc-400 sm:text-sm transition-all rounded-md shadow-sm"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full justify-center rounded-md bg-white text-black py-2.5 px-4 text-sm font-medium hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-colors disabled:opacity-70 shadow-sm"
              >
                {submitting ? "Minting Identity..." : "Continue to Dashboard"}
              </button>

              <button
                type="button"
                onClick={disconnect}
                className="flex w-full justify-center py-2 px-4 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Use a different wallet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
