"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { fundBountyTransaction } from "@/utils/soroban";

const BOUNTY_DETAILS: Record<string, {
  title: string;
  repo: string;
  rewardAmount: string;
  asset: "XLM" | "USDC";
  level: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  requirements: string[];
  rules: string[];
  escrowContract: string;
}> = {
  "SORO-101": {
    title: "Implement Soroban SAC Token Swap Interface",
    repo: "stellar/soroban-examples",
    rewardAmount: "1,500",
    asset: "XLM",
    level: "Beginner",
    description: "Create an intuitive Soroban Asset Contract (SAC) token swap interface leveraging Soroban SDK v21. The interface must handle authorization payloads, fee estimations, and event listening seamlessly.",
    requirements: [
      "Fork the repository and create a feature branch `feat/sac-swap-interface`.",
      "Implement client-side transaction builder with custom Soroban auth invoke calls.",
      "Include unit tests achieving >85% code coverage for state transitions.",
      "Submit Pull Request linking to this bounty ID in the body description."
    ],
    rules: [
      "Bounty must be completed within 7 days of initial lock execution.",
      "Code must pass all GitHub Actions CI workflows.",
      "No unverified third-party npm dependencies permitted."
    ],
    escrowContract: "CCX7...K92L (Soroban Escrow)"
  },
  "default": {
    title: "Build Cross-Chain USDC Bridge Adapter",
    repo: "sorohub/core-contracts",
    rewardAmount: "550",
    asset: "USDC",
    level: "Intermediate",
    description: "Architect a robust Rust-based Soroban contract that processes cross-chain USDC transfer attestations and interacts with native Stellar token balances.",
    requirements: [
      "Implement zero-copy state storage for cross-chain message verification.",
      "Provide CLI submission scripts for Testnet testing.",
      "Document API methods in detail with Markdown examples."
    ],
    rules: [
      "Only 1 active lock per developer permitted at a time.",
      "PR must be reviewed and approved by at least 2 maintainers.",
      "Submissions are evaluated on gas optimization and security."
    ],
    escrowContract: "CA88...3M1P (Soroban Escrow)"
  }
};

export default function BountyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bountyId = (params?.id as string)?.toUpperCase() || "SORO-101";

  const [bounty, setBounty] = useState<any>(null);

  useEffect(() => {
    async function loadBounty() {
      try {
        const { db } = await import("@/utils/firebase");
        const { doc, getDoc } = await import("firebase/firestore");
        
        const docRef = doc(db, "bounties", bountyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setBounty({
            ...data,
            id: bountyId,
            description: data.description || "No detailed description provided for this bounty.",
            requirements: data.requirements || [
              "Fulfill all specifications described in the issue context.",
              "Ensure code builds successfully on Soroban Testnet.",
              "Submit a pull request to the designated repository."
            ],
            rules: data.rules || [
              "Bounty must be completed within the specified timeline.",
              "Code must pass all required CI workflows.",
              "Submissions are evaluated on optimization and security."
            ],
            escrowContract: "CCX7...K92L (Soroban Escrow)"
          });
        } else if (BOUNTY_DETAILS[bountyId]) {
          setBounty(BOUNTY_DETAILS[bountyId]);
        } else {
          setBounty({
            ...BOUNTY_DETAILS["default"],
            title: `Bounty #${bountyId}: Soroban Smart Contract Task`,
          });
        }
      } catch (err) {
        console.error("Failed to load from Firebase:", err);
        setBounty(BOUNTY_DETAILS[bountyId] || {
          ...BOUNTY_DETAILS["default"],
          title: `Bounty #${bountyId}: Soroban Smart Contract Task`,
        });
      }
    }
    
    loadBounty();
  }, [bountyId]);

  const { address, kit, connect, disconnect } = useWallet();
  const [isLocking, setIsLocking] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [prLink, setPrLink] = useState("");
  const [applicantGithub, setApplicantGithub] = useState("");
  const [applicantPortfolio, setApplicantPortfolio] = useState("");
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (bounty?.status === "assigned" && bounty.assignedAt) {
      const calculateTimeLeft = () => {
        const assignedTime = new Date(bounty.assignedAt).getTime();
        const deadlineDays = bounty.deadlineDays || 7;
        const deadlineTime = assignedTime + (deadlineDays * 24 * 60 * 60 * 1000);
        const now = new Date().getTime();
        const difference = deadlineTime - now;

        if (difference <= 0) {
          setTimeLeft("EXPIRED");
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          if (days > 0) {
            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
          } else {
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
          }
        }
      };
      
      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [bounty]);

  if (!bounty) return <div className="min-h-screen bg-black" />;

  const handleApply = async () => {
    if (!address) {
      await connect();
      return;
    }

    if (bounty.funder === address) {
      alert("You cannot apply to your own bounty.");
      return;
    }

    if (bounty.applicantList?.includes(address)) {
      alert("You have already applied to this bounty.");
      return;
    }

    setIsLocking(true);
    setTxStatus("SUBMITTING APPLICATION...");

    try {
      const { db } = await import("@/utils/firebase");
      const { doc, getDoc, updateDoc, arrayUnion } = await import("firebase/firestore");
      
      const userRef = doc(db, "users", address);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        alert("Please complete your profile registration first!");
        router.push("/onboarding");
        return;
      }
      
      const userData = userSnap.data();

      const docRef = doc(db, "bounties", bounty.id || bountyId);
      await updateDoc(docRef, {
        applicantList: arrayUnion(address),
        applicants: (bounty.applicants || 0) + 1,
        [`applicantProfiles.${address}`]: {
          name: userData.name || "Unknown",
          github: userData.github || "",
          portfolio: userData.email || ""
        }
      });

      setTxStatus("SUCCESS! APPLICATION SUBMITTED.");
      setBounty({
        ...bounty,
        applicantList: [...(bounty.applicantList || []), address],
        applicants: (bounty.applicants || 0) + 1,
        applicantProfiles: {
          ...(bounty.applicantProfiles || {}),
          [address]: { 
            name: userData.name || "Unknown", 
            github: userData.github || "", 
            portfolio: userData.email || "" 
          }
        }
      });
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err: any) {
      console.error("Application error:", err);
      setTxStatus(`ERROR: ${err?.message || "Failed to apply"}`);
    } finally {
      setIsLocking(false);
    }
  };

  const handleSubmitPR = async () => {
    if (!prLink) {
      alert("Please enter a valid PR link");
      return;
    }
    
    setIsLocking(true);
    setTxStatus("SUBMITTING PR...");

    try {
      const { db } = await import("@/utils/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      const docRef = doc(db, "bounties", bounty.id || bountyId);
      await updateDoc(docRef, {
        status: "in_review",
        prLink: prLink
      });

      setTxStatus("SUCCESS! PR SUBMITTED.");
      setBounty({ ...bounty, status: "in_review", prLink: prLink });
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err: any) {
      console.error("PR submit error:", err);
      setTxStatus(`ERROR: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  const handleCancel = async () => {
    if (!address || address !== bounty.funder) return;
    setIsLocking(true);
    setTxStatus("CANCELLING BOUNTY AND REFUNDING...");

    try {
      const { cancelBountyTransaction } = await import("@/utils/soroban");
      const { db } = await import("@/utils/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      const numericBountyId = parseInt((bounty.id || bountyId).replace(/\D/g, "")) || 1;
      
      const result = await cancelBountyTransaction(kit, address, numericBountyId);

      if (result.status === "success") {
        const docRef = doc(db, "bounties", bounty.id || bountyId);
        await updateDoc(docRef, {
          status: "cancelled"
        });

        setTxStatus("SUCCESS! BOUNTY CANCELLED & REFUNDED.");
        setBounty({ ...bounty, status: "cancelled" });
        setTimeout(() => setTxStatus(null), 3000);
      }
    } catch (err: any) {
      console.error("Cancel error:", err);
      setTxStatus(`ERROR: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  const handleAssign = async (developer: string) => {
    if (!address) return;
    setIsLocking(true);
    setTxStatus("ASSIGNING BOUNTY...");

    try {
      const { assignBountyTransaction } = await import("@/utils/soroban");
      const { db } = await import("@/utils/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      const numericBountyId = parseInt((bounty.id || bountyId).replace(/\D/g, "")) || 1;
      
      const result = await assignBountyTransaction(kit, address, developer, numericBountyId);

      if (result.status === "success") {
        const assignedAt = new Date().toISOString();
        await updateDoc(doc(db, "bounties", bounty.id || bountyId), {
          status: "assigned",
          assignedTo: developer,
          assignedAt: assignedAt
        });
        
        const { setDoc, arrayUnion } = await import("firebase/firestore");
        await setDoc(doc(db, "users", developer), {
          notifications: arrayUnion({
            id: Date.now().toString(),
            message: `You were assigned to: ${bounty.title}`,
            link: `/bounty/${bounty.id || bountyId}`,
            read: false,
            timestamp: new Date().toISOString()
          })
        }, { merge: true });

        setTxStatus("SUCCESS! BOUNTY ASSIGNED.");
        setBounty({ ...bounty, status: "assigned", assignedTo: developer, assignedAt: assignedAt });
        setTimeout(() => setTxStatus(null), 3000);
      }
    } catch (err: any) {
      console.error("Assign error:", err);
      setTxStatus(`ERROR: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  const handleApprove = async () => {
    if (!address || address !== bounty.funder) return;
    setIsLocking(true);
    setTxStatus("APPROVING PR AND RELEASING FUNDS...");

    try {
      const { claimBountyTransaction } = await import("@/utils/soroban");
      const { db } = await import("@/utils/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      
      const numericBountyId = parseInt((bounty.id || bountyId).replace(/\D/g, "")) || 1;
      
      const result = await claimBountyTransaction(kit, address, bounty.assignedTo, numericBountyId);

      if (result.status === "success") {
        await updateDoc(doc(db, "bounties", bounty.id || bountyId), {
          status: "completed",
        });
        
        const { setDoc, arrayUnion } = await import("firebase/firestore");
        await setDoc(doc(db, "users", bounty.assignedTo), {
          notifications: arrayUnion({
            id: Date.now().toString(),
            message: `Your PR was approved! Funds released.`,
            link: `/bounty/${bounty.id || bountyId}`,
            read: false,
            timestamp: new Date().toISOString()
          })
        }, { merge: true });

        setTxStatus("SUCCESS! FUNDS RELEASED.");
        setBounty({ ...bounty, status: "completed" });
        setTimeout(() => setTxStatus(null), 3000);
      }
    } catch (err: any) {
      console.error("Approve error:", err);
      setTxStatus(`ERROR: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#000000] text-zinc-100 flex flex-col relative selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-black/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <span className="font-semibold text-xl tracking-tight text-white">SoroHub</span>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <span onClick={() => router.push("/")} className="hover:text-white cursor-pointer transition-colors">Overview</span>
            <span onClick={() => router.push("/dashboard")} className="hover:text-white cursor-pointer transition-colors">Bounties</span>
            <span onClick={() => router.push("/profile")} className="hover:text-white cursor-pointer transition-colors">Profile</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-xs font-medium text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
                <span className="text-sm font-medium text-zinc-300">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
              </div>
              <button 
                onClick={disconnect}
                className="text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 rounded-full"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="bg-zinc-100 text-black font-semibold text-sm px-4 py-2 rounded-full hover:bg-white transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-6 py-8 relative z-10 w-full flex-1">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
          <span className="hover:text-zinc-300 cursor-pointer transition-colors" onClick={() => router.push("/dashboard")}>Bounties</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-zinc-300 font-mono">Issue #{bountyId}</span>
        </div>

        {/* Bounty Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-md">
                Open for Claims
              </span>
              <span className="text-sm font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                {bounty.repo}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-100 tracking-tight mb-4 leading-tight">
              {bounty.title}
            </h1>
          </div>

          <div className="w-full lg:w-80 shrink-0 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Bounty Escrow</span>
            <div className="text-4xl font-semibold text-zinc-100 mb-1 flex items-baseline gap-2">
              {bounty.rewardAmount} <span className="text-base text-zinc-400 font-medium">{bounty.asset}</span>
            </div>
            
            {txStatus && (
              <div className="mb-4 mt-2 text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 w-full text-center">
                {isLocking && <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
                {txStatus}
              </div>
            )}

            {address === bounty.funder ? (
              <div className="mt-6 w-full flex flex-col gap-2 text-left">
                <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">Manage Applicants</div>
                {!bounty.applicantList || bounty.applicantList.length === 0 ? (
                  <div className="text-sm text-zinc-400 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 text-center">
                    No applicants yet.
                  </div>
                ) : bounty.status === "assigned" ? (
                  <div className="text-sm bg-indigo-500/10 text-indigo-400 p-3 rounded-lg border border-indigo-500/20 text-center font-medium">
                    Assigned to: {bounty.assignedTo?.slice(0,4)}...{bounty.assignedTo?.slice(-4)}
                  </div>
                ) : bounty.status === "in_review" ? (
                  <div className="flex flex-col gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-2">
                    <span className="font-semibold text-sm text-emerald-400 text-center">PR Ready for Review!</span>
                    <a href={bounty.prLink} target="_blank" rel="noreferrer" className="text-xs text-white text-center underline hover:text-emerald-300 bg-black/40 py-2 rounded">
                      View Pull Request
                    </a>
                    <button 
                      onClick={handleApprove}
                      disabled={isLocking}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
                    >
                      {isLocking ? "Approving..." : "Approve & Release Funds"}
                    </button>
                  </div>
                ) : bounty.status === "completed" ? (
                  <div className="text-sm bg-purple-500/10 text-purple-400 p-3 rounded-lg border border-purple-500/20 text-center font-medium flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Bounty Completed
                  </div>
                ) : bounty.status === "cancelled" ? (
                  <div className="text-sm bg-red-500/10 text-red-400 p-3 rounded-lg border border-red-500/20 text-center font-medium flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Bounty Cancelled
                  </div>
                ) : (
                  bounty.applicantList.map((app: string) => {
                    const profile = bounty.applicantProfiles?.[app] || {};
                    return (
                      <div key={app} className="flex flex-col bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50 gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">{profile.name || "Unknown Developer"}</span>
                            <span className="text-[10px] font-mono text-zinc-400">{app.slice(0, 6)}...{app.slice(-4)}</span>
                          </div>
                          <button 
                            onClick={() => handleAssign(app)}
                            disabled={isLocking}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Assign
                          </button>
                        </div>
                        {(profile.github || profile.portfolio) && (
                          <div className="flex items-center gap-3 text-xs mt-1 border-t border-zinc-700/50 pt-2">
                            {profile.github && (
                              <a 
                                href={profile.github.startsWith('http') ? profile.github : `https://${profile.github.includes('github.com') ? profile.github : 'github.com/' + profile.github}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-zinc-300 hover:text-white flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                                GitHub
                              </a>
                            )}
                            {profile.portfolio && (
                              <a 
                                href={profile.portfolio.includes('@') && !profile.portfolio.startsWith('http') ? `mailto:${profile.portfolio}` : (profile.portfolio.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-zinc-300 hover:text-white flex items-center gap-1"
                              >
                                {profile.portfolio.includes('@') && !profile.portfolio.startsWith('http') ? (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    Email
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    Portfolio
                                  </>
                                )}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {bounty.status === "open" && (
                  <button
                    onClick={handleCancel}
                    disabled={isLocking}
                    className="w-full mt-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium text-xs px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    {isLocking ? "Processing..." : "Cancel Bounty & Refund Escrow"}
                  </button>
                )}
              </div>
            ) : bounty.status === "assigned" && bounty.assignedTo === address ? (
              <div className="mt-6 flex flex-col gap-3 w-full">
                <input 
                  type="url" 
                  value={prLink}
                  onChange={(e) => setPrLink(e.target.value)}
                  placeholder="Paste GitHub PR Link..."
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 focus:bg-[#0a0a0a] transition-all shadow-sm" 
                />
                <button 
                  onClick={handleSubmitPR}
                  disabled={isLocking}
                  className="w-full flex justify-center rounded-md bg-white text-black py-2 px-4 text-sm font-medium hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-colors disabled:opacity-70 shadow-sm"
                >
                  {isLocking ? "Submitting..." : "Submit PR for Review"}
                </button>
                <span className="text-[11px] text-zinc-400 mt-1 font-medium text-center">Funder must approve to release funds</span>
              </div>
            ) : bounty.status === "in_review" && bounty.assignedTo === address ? (
              <div className="mt-6 w-full bg-emerald-500/10 text-emerald-400 p-4 rounded-lg border border-emerald-500/20 text-center flex flex-col gap-2">
                <span className="font-semibold text-sm">PR Submitted!</span>
                <a href={bounty.prLink} target="_blank" rel="noreferrer" className="text-xs underline hover:text-emerald-300">View Pull Request</a>
                <span className="text-xs text-zinc-300">Waiting for funder approval...</span>
              </div>
            ) : bounty.status === "assigned" || bounty.status === "in_review" ? (
              <button disabled className="mt-6 w-full bg-zinc-800 text-zinc-400 font-medium text-sm px-6 py-3 rounded-lg cursor-not-allowed">
                Bounty Assigned to Someone Else
              </button>
            ) : bounty.status === "completed" && bounty.assignedTo === address ? (
              <div className="mt-6 w-full bg-purple-500/10 text-purple-400 p-4 rounded-lg border border-purple-500/20 text-center flex flex-col gap-2">
                <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                <span className="font-semibold text-sm">Bounty Completed!</span>
                <span className="text-xs text-zinc-300">Funds have been released to your wallet.</span>
              </div>
            ) : bounty.status === "completed" ? (
              <button disabled className="mt-6 w-full bg-zinc-800 text-zinc-400 font-medium text-sm px-6 py-3 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Bounty Completed
              </button>
            ) : (
              <div className="mt-6 flex flex-col gap-3 w-full">
                {!address ? (
                  <button 
                    className="w-full bg-zinc-100 hover:bg-white text-black font-semibold text-sm px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    onClick={() => connect().catch(console.error)}
                  >
                    Connect Wallet to Apply
                  </button>
                ) : bounty.applicantList?.includes(address) ? (
                  <button disabled className="w-full bg-zinc-800 text-zinc-300 font-medium text-sm px-6 py-3 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Application Submitted
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleApply}
                      disabled={isLocking}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                    >
                      {isLocking ? "Submitting..." : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          Apply for Bounty
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-zinc-400 mt-1 font-medium text-center">Smart Contract Interaction Required</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Context */}
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">Issue Context</h2>
              <div className="text-sm text-zinc-300 space-y-4 leading-relaxed whitespace-pre-wrap">
                {bounty.description}
              </div>
            </section>

            {/* Requirements List */}
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">Technical Requirements</h2>
              <ul className="flex flex-col gap-3">
                {bounty.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50">
                    <svg className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-sm text-zinc-300 leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Verification Rules */}
            <section>
              <h2 className="text-lg font-semibold text-zinc-100 mb-4 pb-2 border-b border-zinc-800">Escrow Release Rules</h2>
              <ul className="flex flex-col gap-3">
                {bounty.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50">
                    <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-500 text-xs font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm text-zinc-300 leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Meta Information Sidebar */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Category</h3>
                <span className="inline-flex text-sm font-medium text-zinc-300 bg-zinc-800 px-3 py-1 rounded-md">
                  Smart Contract
                </span>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Experience Level</h3>
                <span className="inline-flex text-sm font-medium text-zinc-300 bg-zinc-800 px-3 py-1 rounded-md">
                  {bounty.level}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Deadline</h3>
                <div className="flex items-center gap-2">
                  <span className="inline-flex text-sm font-medium text-zinc-300 bg-zinc-800 px-3 py-1 rounded-md">
                    {bounty.deadlineDays || 7} Days
                  </span>
                  {bounty.status === "assigned" && timeLeft && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${timeLeft === "EXPIRED" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {timeLeft === "EXPIRED" ? "EXPIRED" : `${timeLeft} left`}
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Applicants</h3>
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  {bounty.applicants || 0} Developers
                </div>
              </div>
            </div>

            {/* Smart Contract Info */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 flex flex-col gap-3">
              <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Contract Details</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Escrow</span>
                  <span className="text-zinc-300 font-mono text-xs">{bounty.escrowContract.split(" ")[0]}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Oracle</span>
                  <span className="text-zinc-300">GitHub Verified</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-400">Network</span>
                  <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Soroban Testnet
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
