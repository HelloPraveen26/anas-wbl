'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [countdown, setCountdown] = useState(5);

    const amount = searchParams.get('amount');
    const txnid = searchParams.get('txnid');

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/admin/wallet');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-gray-100 text-center animate-in zoom-in duration-500">
                <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
                        <CheckCircle2 size={48} className="text-emerald-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-black text-gray-900 mb-4">Payment Successful!</h1>
                <p className="text-gray-600 mb-8 font-medium">
                    Your wallet has been topped up successfully.
                </p>

                <div className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-bold uppercase tracking-wider">Amount Paid</span>
                        <span className="text-gray-900 font-black text-lg">₹{parseFloat(amount || '0').toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-3">
                        <span className="text-gray-400 font-bold uppercase tracking-wider">Transaction ID</span>
                        <span className="text-gray-600 font-mono text-xs">{txnid}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => router.push('/admin/wallet')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 group"
                    >
                        Back to Wallet
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
                        <Loader2 size={16} className="animate-spin" />
                        Redirecting in {countdown}s...
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
