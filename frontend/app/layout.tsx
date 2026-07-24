import "./globals.css";
import type { Metadata } from "next";
import { WalletProvider } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "SoroHub - Soroban Multi-Asset Escrow Protocol",
  description: "Automated Web3 bounties funded in XLM and USDC via Soroban smart contracts.",
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
          <WalletProvider>{children}</WalletProvider>
        </div>
      </body>
    </html>
  );
}
