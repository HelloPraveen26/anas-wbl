"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { User as UserType } from "@/lib/api";
import { useUserRefresh } from "@/hooks/useUserRefresh";
import { useToast } from "@/hooks/useToast";

interface PaymentCallbackHandlerProps {
  user: UserType | null;
  onUserUpdate: (user: UserType) => void;
}

export function PaymentCallbackHandler({ user, onUserUpdate }: PaymentCallbackHandlerProps) {
  const searchParams = useSearchParams();
  const { refreshUser } = useUserRefresh();
  const { success } = useToast();

  // Use a ref to track if we've already processed the payment callback
  // This prevents infinite loops if dependencies change
  const processedRef = useRef(false);

  useEffect(() => {
    const checkPaymentCallback = async () => {
      // If already processed, don't run again
      if (processedRef.current) return;

      const txnid = searchParams.get("txnid");
      const status = searchParams.get("status");
      const mihpayid = searchParams.get("mihpayid");
      const paymentParam = searchParams.get("payment");

      // Check if this is a payment callback
      const isPaymentCallback =
        txnid ||
        status ||
        mihpayid ||
        paymentParam ||
        (typeof document !== "undefined" && document.referrer.includes("payu"));

      if (isPaymentCallback) {
        console.log("Payment callback detected, refreshing user data...");

        // Mark as processed immediately to prevent double execution
        processedRef.current = true;

        // Show processing toast
        success("Processing payment... Please wait.", 2000);

        // Small delay to ensure server processing is complete
        setTimeout(async () => {
          const result = await refreshUser();
          if (result.success && result.user) {
            const oldCredits = user?.credits || 0;
            const newCredits = result.user.credits || 0;
            onUserUpdate(result.user);

            console.log("User data refreshed, new credits:", newCredits);

            // Show success toast if credits increased
            if (newCredits > oldCredits) {
              const creditDiff = newCredits - oldCredits;
              success(
                `Payment successful! Added ${creditDiff} credits to your account.`,
                5000,
              );
            } else if (status === "success" || paymentParam === "success") {
              success("Payment processed successfully!", 3000);
            }
          } else {
            console.error("Failed to refresh user data:", result.error);
            // If failed, we might want to allow retrying, but for now let's stay safe to avoid loops
            // processedRef.current = false; 
          }
        }, 2000);
      }
    };

    checkPaymentCallback();
  }, [searchParams, refreshUser, success, onUserUpdate, user?.credits]);

  return null;
}
