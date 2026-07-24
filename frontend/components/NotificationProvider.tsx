"use client";

import { useEffect, useState } from "react";
import { useWallet } from "./WalletProvider";
import { useRouter } from "next/navigation";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string, id: string, link?: string } | null>(null);

  useEffect(() => {
    if (!address) return;
    
    let unsubscribe: () => void;
    
    async function listenToNotifications() {
      try {
        const { db } = await import("@/utils/firebase");
        const { doc, onSnapshot, updateDoc } = await import("firebase/firestore");
        
        unsubscribe = onSnapshot(doc(db, "users", address!), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.notifications && data.notifications.length > 0) {
              const unread = data.notifications.find((n: any) => !n.read);
              if (unread) {
                // Show toast
                setToast({ message: unread.message, id: unread.id, link: unread.link });
                
                // Mark as read immediately in Firebase so it doesn't trigger again
                const updatedNotifs = data.notifications.map((n: any) => 
                  n.id === unread.id ? { ...n, read: true } : n
                );
                updateDoc(doc(db, "users", address!), { notifications: updatedNotifs });
                
                // Hide toast after 8s
                setTimeout(() => setToast(null), 8000);
              }
            }
          }
        });
      } catch (err) {
        console.error("Failed to listen for notifications:", err);
      }
    }
    
    listenToNotifications();
    
    return () => {
      if (unsubscribe) unsubscribe();
    }
  }, [address]);

  return (
    <>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] animate-bounce">
          <div className="bg-indigo-600 text-white px-5 py-4 rounded-xl shadow-[0_10px_40px_rgba(79,70,229,0.4)] flex items-start gap-4 max-w-sm border border-indigo-400/30">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-sm">New Notification</span>
              <span className="text-xs text-indigo-100">{toast.message}</span>
              {toast.link && (
                <button 
                  onClick={() => {
                    router.push(toast.link!);
                    setToast(null);
                  }} 
                  className="text-xs font-bold underline mt-1 text-white hover:text-indigo-200 text-left"
                >
                  View Details
                </button>
              )}
            </div>
            <button onClick={() => setToast(null)} className="text-white/50 hover:text-white transition-colors ml-auto p-1" aria-label="Close notification">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
