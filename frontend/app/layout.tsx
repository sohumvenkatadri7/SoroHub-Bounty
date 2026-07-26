import "./globals.css";
import type { Metadata } from "next";
import { WalletProvider } from "@/components/WalletProvider";

import { NotificationProvider } from "@/components/NotificationProvider";
import { Analytics } from "@vercel/analytics/react";
export const metadata: Metadata = {
  title: "SoroHub - Decentralized Bounties",
  description: "Automated Web3 bounties funded in XLM and USDC via Soroban smart contracts.",
  openGraph: {
    title: "SoroHub - Web3 Developer Bounties",
    description: "Earn XLM and USDC by solving open-source issues on Stellar.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#09090b] text-slate-50 font-sans antialiased min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200 relative">
        {/* Modern SaaS Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex justify-center">
          <div className="absolute top-[-20%] w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen" />
        </div>
        
        <div className="relative z-10 flex flex-col min-h-screen">
          <WalletProvider>
            <NotificationProvider>
              {children}
              <Analytics />
            </NotificationProvider>
          </WalletProvider>
        </div>
      </body>
    </html>
  );
}
