"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { db } from "@/utils/firebase";
import { collection, onSnapshot, query, doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";

interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardAmount: string;
  asset: string;
  funder: string;
  status: "open" | "assigned" | "in_review" | "completed";
  assignedTo?: string;
  applicantList?: string[];
  applicantProfiles?: Record<string, any>;
  level: string;
}

interface UserProfile {
  name: string;
  email: string;
  github: string;
  portfolio?: string;
}

export default function ManagePage() {
  const router = useRouter();
  const { address, connect } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!address) return;

    // Fetch Profile
    const fetchProfile = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", address));
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();

    // Fetch Bounties
    const q = query(collection(db, "bounties"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Bounty[];
      // Filter strictly for bounties funded by this address
      const myBounties = fetched.filter(b => b.funder === address).sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.id.replace(/\D/g, "")) || 0;
        return numB - numA;
      });
      setBounties(myBounties);
    });

    return () => unsubscribe();
  }, [address]);

  const handleAssign = async (bounty: Bounty, developer: string) => {
    if (confirm(`Assign ${developer.slice(0, 4)}... to this bounty?`)) {
      try {
        await updateDoc(doc(db, "bounties", bounty.id), {
          status: "assigned",
          assignedTo: developer
        });
        
        await setDoc(doc(db, "users", developer), {
          notifications: arrayUnion({
            id: Date.now().toString(),
            message: `You were assigned to: ${bounty.title}`,
            link: `/bounty/${bounty.id}`,
            read: false,
            timestamp: new Date().toISOString()
          })
        }, { merge: true });
        alert(`Bounty assigned successfully!`);
      } catch (err: any) {
        console.error("Assign error:", err);
        alert(`Error assigning: ${err.message}`);
      }
    }
  };

  const completedPayouts = bounties.filter(b => b.status === "completed").reduce((sum, b) => sum + (parseInt(b.rewardAmount) || 0), 0);

  return (
    <div className="min-h-screen font-sans bg-[#000000] text-zinc-100 flex flex-col relative selection:bg-indigo-500/30">
      
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push("/")}>
            <span className="font-semibold text-xl tracking-tight text-white">SoroHub</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            Soroban Testnet
          </div>
          
          <button
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/30 hover:scale-105 transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </button>
        </div>
      </header>

      {address ? (
        <main className="max-w-[1200px] mx-auto px-6 py-8 relative z-10 w-full flex-1 flex flex-col gap-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Manage Bounties</h1>
              <p className="text-sm text-zinc-300">View your Funder profile and manage the bounties you have created.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push("/dashboard")}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => router.push("/create")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Fund a Bounty
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Bounties List */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
                {bounties.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No Bounties Created</h3>
                    <p className="text-zinc-300 text-sm max-w-sm mb-6">You haven't funded any bounties yet. Create your first bounty to start working with top developers.</p>
                    <button onClick={() => router.push("/create")} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1 group">
                      Create Bounty <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </button>
                  </div>
                ) : (
                  bounties.map((bounty) => (
                    <div key={bounty.id} onClick={() => router.push(`/bounty/${bounty.id}`)} className="p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-mono font-medium text-zinc-400">{bounty.id}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                              bounty.status === "open" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : bounty.status === "completed" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {bounty.status.replace("_", " ")}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">{bounty.title}</h3>
                          <div className="flex items-center gap-4 text-xs font-medium text-zinc-300">
                            <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> {bounty.level}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-400">{bounty.rewardAmount} <span className="text-xs text-emerald-500/70">{bounty.asset}</span></div>
                            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">Reward</div>
                          </div>
                          
                          {bounty.status === "open" && bounty.applicantList && bounty.applicantList.length > 0 && (
                            <div className="w-full flex flex-col gap-1.5 mt-2 bg-black/40 border border-white/5 rounded-lg p-2" onClick={(e) => e.stopPropagation()}>
                              <div className="text-[10px] font-semibold text-zinc-300 uppercase">Applicants ({bounty.applicantList.length})</div>
                              {bounty.applicantList.map((app) => {
                                const p = bounty.applicantProfiles?.[app] || {};
                                return (
                                  <div key={app} className="flex flex-col bg-white/5 rounded p-1.5 gap-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-mono text-zinc-300">{app.slice(0, 4)}...{app.slice(-4)}</span>
                                      <button onClick={() => handleAssign(bounty, app)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold">Assign</button>
                                    </div>
                                    {(p.github || p.portfolio) && (
                                      <div className="flex gap-2 text-[10px] border-t border-white/5 pt-1 mt-0.5">
                                        {p.github && (
                                          <a href={p.github.startsWith('http') ? p.github : `https://${p.github.includes('github.com') ? p.github : 'github.com/' + p.github}`} target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white flex items-center gap-1">GitHub</a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {(bounty.status === "assigned" || bounty.status === "in_review") && (
                            <div className="w-full text-xs bg-indigo-500/10 text-indigo-400 px-3 py-2 rounded border border-indigo-500/20 text-center font-medium">
                              Assigned to: {bounty.assignedTo?.slice(0,4)}...{bounty.assignedTo?.slice(-4)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Funder Details */}
            <div className="flex flex-col gap-8">
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
                
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Funder Profile
                </h2>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1">Name</div>
                    <div className="text-white text-sm font-medium">{profile?.name || "Anonymous Funder"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1">Email</div>
                    <div className="text-zinc-300 text-sm">{profile?.email || "Not Provided"}</div>
                  </div>
                  {profile?.github && (
                    <div>
                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-1">GitHub</div>
                      <a href={profile.github.startsWith('http') ? profile.github : `https://${profile.github.includes('github.com') ? profile.github : 'github.com/' + profile.github}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm break-all">
                        {profile.github}
                      </a>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total Funded</div>
                      <div className="text-sm font-bold text-white">{bounties.length}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total Disbursed</div>
                      <div className="text-sm font-bold text-emerald-400">{completedPayouts} XLM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-6 py-20">
          <div className="text-center mb-12 max-w-lg mx-auto relative z-10">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Connect your wallet</h1>
            <p className="text-zinc-300 text-lg leading-relaxed">Sign in to manage your funded bounties.</p>
            <button onClick={connect} className="mt-10 bg-white text-black font-semibold text-base px-8 py-3.5 rounded-full hover:bg-slate-200 transition-all">
              Connect Wallet
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
