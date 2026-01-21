"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    const checkPaymentCallback = async () => {
      const txnid = searchParams.get("txnid");
      const status = searchParams.get("status");
      const mihpayid = searchParams.get("mihpayid");
      const paymentParam = searchParams.get("payment");
      const amount = searchParams.get("amount");

      // If coming from payment, refresh user data
      if (
        txnid ||
        status ||
        mihpayid ||
        paymentParam ||
        (typeof document !== "undefined" && document.referrer.includes("payu"))
      ) {
        console.log("Payment callback detected, refreshing user data...");

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
          }
        }, 2000);
      }
    };

    checkPaymentCallback();
  }, [searchParams, refreshUser, user?.credits, success, onUserUpdate]);

  return null;
}
