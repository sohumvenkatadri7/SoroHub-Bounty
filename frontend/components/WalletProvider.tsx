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

    // 3. Restore session if exists
    const savedAddress = localStorage.getItem("sorohub_wallet_address");
    if (savedAddress) {
      // Verify session is still valid with Freighter
      import("@stellar/freighter-api").then(({ isAllowed, getPublicKey }) => {
        isAllowed().then(async (allowed) => {
          if (!allowed) {
            // Wallet locked or permissions revoked
            localStorage.removeItem("sorohub_wallet_address");
            setAddress(null);
            return;
          }
          
          try {
            const currentPubKey = await getPublicKey();
            const activeAddress = currentPubKey || savedAddress;
            setAddress(activeAddress);
            if (currentPubKey && currentPubKey !== savedAddress) {
              localStorage.setItem("sorohub_wallet_address", currentPubKey);
            }
            
            // Background check for registration
            const { db } = await import("@/utils/firebase");
            const { doc, getDoc } = await import("firebase/firestore");
            const docSnap = await getDoc(doc(db, "users", activeAddress));
            if (!docSnap.exists() && window.location.pathname !== "/onboarding") {
              window.location.href = "/onboarding";
            }
          } catch (e) {
            console.error("Freighter verification failed:", e);
          }
        }).catch(() => {
           // Fallback if freighter is not installed but another wallet is used
           setAddress(savedAddress);
        });
      }).catch(() => {
         setAddress(savedAddress);
      });
    }
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
      localStorage.setItem("sorohub_wallet_address", publicKey);

      // Check if user is registered
      const { db } = await import("@/utils/firebase");
      const { doc, getDoc } = await import("firebase/firestore");
      const docSnap = await getDoc(doc(db, "users", publicKey));
      
      if (!docSnap.exists()) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
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
    localStorage.removeItem("sorohub_wallet_address");
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