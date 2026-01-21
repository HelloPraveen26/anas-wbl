"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUserRefresh } from "./useUserRefresh";

export function usePaymentCallback() {
  const searchParams = useSearchParams();
  const { refreshUser } = useUserRefresh();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      const txnid = searchParams.get("txnid");
      const status = searchParams.get("status");
      const mihpayid = searchParams.get("mihpayid");
      const paymentParam = searchParams.get("payment");

      // Check if this is a payment callback
      if (txnid || status || mihpayid || paymentParam) {
        console.log("Payment callback detected:", {
          txnid,
          status,
          mihpayid,
          paymentParam,
        });

        // Small delay to ensure server processing is complete
        setTimeout(async () => {
          console.log("Refreshing user data after payment...");
          const result = await refreshUser();
          if (!result.success) {
            console.error("Failed to refresh user data:", result.error);
          }
        }, 2000);
      }

      // Also check document referrer for PayU
      if (
        typeof document !== "undefined" &&
        (document.referrer.includes("payu") ||
          document.referrer.includes("payment"))
      ) {
        console.log("Payment referrer detected, refreshing user data...");

        setTimeout(async () => {
          const result = await refreshUser();
          if (!result.success) {
            console.error("Failed to refresh user data:", result.error);
          }
        }, 2000);
      }
    };

    handlePaymentCallback();
  }, [searchParams, refreshUser]);
}
