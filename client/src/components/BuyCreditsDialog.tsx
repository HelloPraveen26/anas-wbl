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
import { CreditCard, Loader2 } from "lucide-react";
import { authManager } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api";

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
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (amountValue < 1) {
      setError("Minimum amount is ₹1");
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
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError("");
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

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-9 text-sm font-semibold shadow-sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Buy Credits
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Buy Credits
          </DialogTitle>
          <DialogDescription>
            Enter the amount you want to add to your account. You'll be
            redirected to PayU for secure payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              disabled={isLoading}
              className="text-lg"
              autoFocus
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>

          {/* Quick amount buttons */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Quick select:</Label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAmount(quickAmount.toString());
                    setError("");
                  }}
                  disabled={isLoading}
                  className="text-xs h-8 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                >
                  ₹{quickAmount}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !amount}
              className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Pay
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
