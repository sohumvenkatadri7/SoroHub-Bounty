"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";

interface WalletContextType {
  address: string | null;
  kit: typeof StellarWalletsKit | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [kitInitialized, setKitInitialized] = useState(false);

  useEffect(() => {
    // 1. Initialize strictly inside useEffect so Next.js doesn't crash on the server
    StellarWalletsKit.init({
      network: "TESTNET" as any, // Bypasses the Next.js/Webpack enum bug
      selectedWalletId: "freighter",
      // 2. Explicitly instantiate the wallet modules
      modules: [new FreighterModule(), new xBullModule(), new AlbedoModule()],
    });
    setKitInitialized(true);
  }, []);

  const router = useRouter();

  const connect = async () => {
    if (!kitInitialized) {
      console.error("Wallet kit not initialized yet.");
      return false;
    }
    
    try {
      // SWK v2 authModal handles both wallet selection and returning the connected address
      const { address: publicKey } = await StellarWalletsKit.authModal();
      setAddress(publicKey);
      return true;
    } catch (error: any) {
      // The modal throws errors on user cancellation or if the extension is not installed.
      // We return false cleanly to prevent unhandled promise rejections.
      console.log("Wallet connection cancelled or failed:", error?.message || error);
      return false;
    }
  };

  const disconnect = () => {
    StellarWalletsKit.disconnect().catch(console.error);
    setAddress(null);
  };

  return (
    <WalletContext.Provider value={{ address, kit: kitInitialized ? StellarWalletsKit : null, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within a WalletProvider");
  return context;
};