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
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#000000] relative selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-3 cursor-pointer group z-20" onClick={() => router.push("/")}>
        <span className="font-semibold text-xl tracking-tight text-white">SoroHub</span>
      </div>

      <div className="w-full max-w-3xl flex flex-col md:flex-row bg-[#0a0a0a]/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10 overflow-hidden">
        
        {/* Left Side: Visual / Brand */}
        <div className="md:w-5/12 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
              Developer <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Passport</span>
            </h2>
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Mint your identity. Solve issues. Earn crypto and soulbound badges.
            </p>
          </div>

          <div className="mt-12 md:mt-0 relative z-10">
            <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-semibold">Connected Wallet</div>
              <div className="text-sm font-mono text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connecting...'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-7/12 p-8 sm:p-10 bg-black/20">
          <form className="space-y-6 h-full flex flex-col justify-center" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="group">
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 group-focus-within:text-indigo-400 transition-colors">Developer Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full bg-white/[0.02] border-b-2 border-white/10 py-3 pl-2 pr-3 text-white placeholder-zinc-700 focus:border-indigo-500 focus:bg-white/[0.04] focus:outline-none focus:ring-0 sm:text-sm transition-all rounded-t-lg"
                    placeholder="Satoshi Nakamoto"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 group-focus-within:text-indigo-400 transition-colors">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full bg-white/[0.02] border-b-2 border-white/10 py-3 pl-2 pr-3 text-white placeholder-zinc-700 focus:border-indigo-500 focus:bg-white/[0.04] focus:outline-none focus:ring-0 sm:text-sm transition-all rounded-t-lg"
                    placeholder="satoshi@stellar.org"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 group-focus-within:text-indigo-400 transition-colors">GitHub URL</label>
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-zinc-600 group-focus-within:text-indigo-400 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
                  </span>
                  <input
                    type="url"
                    required
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="block w-full bg-white/[0.02] border-b-2 border-white/10 py-3 pl-9 pr-3 text-white placeholder-zinc-700 focus:border-indigo-500 focus:bg-white/[0.04] focus:outline-none focus:ring-0 sm:text-sm transition-all rounded-t-lg"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="group relative flex w-full justify-center rounded-xl bg-white text-black py-4 px-4 text-sm font-bold hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70 hover:scale-[1.02]"
              >
                {submitting ? (
                  "Minting Identity..."
                ) : (
                  <span className="flex items-center gap-2">
                    Enter Dashboard
                    <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={disconnect}
                className="flex w-full justify-center py-2 px-4 text-xs font-semibold text-zinc-500 hover:text-white transition-colors"
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
