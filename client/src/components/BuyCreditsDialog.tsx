"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, ShieldCheck, Zap, ArrowRight, Wallet } from "lucide-react";
import { authManager } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BuyCreditsDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  onPaymentInitiated?: () => void;
}

export function BuyCreditsDialog({
  trigger,
  onSuccess,
  onPaymentInitiated,
}: BuyCreditsDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const getAuthHeaders = () => {
    const token = authManager.getToken();
    return {
      accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate amount
    const amountValue = parseInt(amount, 10);
    if (!amount || isNaN(amountValue)) {
      setError("Please enter a valid numeric amount");
      return;
    }

    if (amountValue < 2000) {
      setError("Amount must be at least 2000.");
      return;
    }

    if (amountValue > 100000) {
      setError("Maximum amount is ₹100,000");
      return;
    }

    setIsLoading(true);

    try {
      const reference = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const response = await fetch(
        `${getApiBaseUrl()}/payment/create-payment`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountValue,
            reference: reference,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment");
      }

      const result = await response.json();

      if (result.success) {
        // Close the dialog first
        setOpen(false);

        // Call payment initiated callback if provided
        if (onPaymentInitiated) {
          onPaymentInitiated();
        }

        // Create and submit a form to PayU
        const form = document.createElement("form");
        form.method = "POST";
        form.action = result.paymentUrl;

        // Add all parameters as hidden fields
        for (const key in result.formData) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = result.formData[key];
          form.appendChild(input);
        }

        // Add the form to the document and submit it
        document.body.appendChild(form);
        form.submit();

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.message || "Payment initiation failed");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits
    if (value === "" || /^\d+$/.test(value)) {
      setAmount(value);

      const numValue = parseInt(value, 10);
      if (value !== "" && numValue < 2000) {
        setError("Amount must be at least 2000.");
      } else {
        setError("");
      }
    }
  };


  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && !isLoading) {
      // Reset form when dialog closes
      setAmount("");
      setError("");
    }
  };

  const quickAmounts = [2000, 5000, 8000, 10000, 15000];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white h-11 text-sm font-bold shadow-lg shadow-emerald-500/20 group transition-all duration-300 active:scale-95">
            <CreditCard className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            Buy Credits
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none bg-white/95 backdrop-blur-xl shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-gray-900">
                Top Up Wallet
              </DialogTitle>
              {/* <DialogDescription className="text-gray-500 text-sm">
                Add credits to your account instantly
              </DialogDescription> */}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="text-sm font-semibold text-gray-700">Amount (₹)</Label>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">INR Currency</span>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium text-lg group-focus-within:text-emerald-500 transition-colors">₹</span>
              </div>
              <Input
                id="amount"
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={isLoading}
                className="pl-8 text-2xl font-bold h-14 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all bg-gray-50/30"
                autoFocus
              />
            </div>
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Quick Top Up
            </div>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => {
                    setAmount(quickAmount.toString());
                    setError("");
                  }}
                  disabled={isLoading}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border text-[13px] font-bold transition-all duration-200",
                    amount === quickAmount.toString()
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50"
                  )}
                >
                  <span className="text-[10px] opacity-70 font-medium leading-none mb-0.5">₹</span>
                  {quickAmount}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Secure Payment</p>
                <p className="text-[11px] text-emerald-700/80 leading-relaxed font-medium">
                  Your transaction is encrypted and secured by PayU. Credits are added instantly after success.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-0 pt-2 pb-6 flex flex-col-reverse sm:flex-row gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1 h-12 font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 border-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !amount || parseInt(amount, 10) < 2000}
              className="flex-[2] h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 group transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Transaction...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Proceed to Pay
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform opacity-50" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
