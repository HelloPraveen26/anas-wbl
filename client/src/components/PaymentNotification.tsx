"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentNotification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const payment = searchParams.get("payment");

    if (payment) {
      let title = "";
      let description = "";
      let variant: "success" | "error" | "warning" | "default" = "default";
      let icon = null;

      switch (payment) {
        case "success":
          variant = "success";
          title = "Payment Successful! 🎉";
          description =
            "Your payment has been processed successfully. Credits have been added to your account.";
          icon = <CheckCircle className="w-5 h-5 text-emerald-600" />;
          break;
        case "failed":
          variant = "error";
          title = "Payment Failed";
          description =
            "Your payment could not be processed. Please try again or contact support if the issue persists.";
          icon = <XCircle className="w-5 h-5 text-red-600" />;
          break;
        case "cancelled":
          variant = "warning";
          title = "Payment Cancelled";
          description =
            "Your payment was cancelled. You can try again whenever you're ready.";
          icon = <AlertCircle className="w-5 h-5 text-amber-600" />;
          break;
        case "error":
          variant = "error";
          title = "Payment Error";
          description =
            "There was an error processing your payment. Please try again.";
          icon = <XCircle className="w-5 h-5 text-red-600" />;
          break;
        default:
          return;
      }

      // Show toast notification
      toast({
        variant,
        title,
        description: (
          <div className="flex items-center gap-2">
            {icon}
            <span>{description}</span>
          </div>
        ),
        duration: payment === "success" ? 8000 : 12000,
      });

      // Clean up URL without page refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, router, toast]);

  // This component doesn't render anything visible
  // The toast system handles the display
  return null;
}
