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

      <div className="w-full max-w-md space-y-8 bg-black/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Developer Passport
          </h2>
          <p className="mt-3 text-center text-sm text-zinc-300 max-w-[280px] leading-relaxed">
            Link your GitHub to build your on-chain reputation.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            {/* Form Fields */}
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="Satoshi Nakamoto"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="satoshi@stellar.org"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">GitHub Profile URL</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" /></svg>
                  </div>
                  <input
                    type="url"
                    required
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="block w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-black transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                "Saving Profile..."
              ) : (
                <span className="flex items-center gap-2">
                  Continue to Dashboard
                  <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={disconnect}
              className="flex w-full justify-center rounded-xl border border-white/10 bg-transparent py-3.5 px-4 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-all"
            >
              Disconnect Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
