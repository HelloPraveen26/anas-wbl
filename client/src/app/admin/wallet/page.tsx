'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    IndianRupee,
    Zap,
    TrendingUp,
    Plus,
    History,
    AlertCircle,
    Loader2,
    CreditCard,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { authManager } from '@/lib/auth';

interface Transaction {
    id: string;
    createdAt: string;
    amount: string;
    status: string;
    txnid: string;
    mihpayid?: string;
}

// Separate component that uses useSearchParams (must be wrapped in Suspense)
function WalletContent() {
    const searchParams = useSearchParams();
    const [balance, setBalance] = useState(0);
    const [credits, setCredits] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState('5000');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'cancelled' | null>(null);
    const paymentFormRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        // Check for payment callback in URL
        const payment = searchParams.get('payment');
        if (payment === 'success') setPaymentStatus('success');
        else if (payment === 'failed') setPaymentStatus('failed');
        else if (payment === 'cancelled') setPaymentStatus('cancelled');

        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setIsLoading(true);
            const token = authManager.getToken();
            if (!token) return;

            // Fetch profile for balance/credits
            const profile = await api.getProfile(token);
            if (profile.success && profile.data?.user) {
                const userData = profile.data.user;
                setBalance(userData.balance || 0);
                setCredits(userData.credits || 0);
            }

            // Fetch real transaction history
            try {
                const historyRes = await api.getPaymentHistory(token);
                if (historyRes.success && historyRes.data) {
                    setTransactions(historyRes.data);
                }
            } catch {
                // Non-critical — leave transactions empty
            }
        } catch (err: any) {
            setError('Failed to load wallet data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopUp = async () => {
        const amount = parseFloat(topUpAmount);
        if (!amount || amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const token = authManager.getToken();
            if (!token) throw new Error('Not authenticated');

            // Call backend to create PayU payment
            const res = await api.createPayment(token, amount) as any;

            // Backend returns { success, message, txnid, paymentUrl, formData } at root level
            const paymentUrl = res.paymentUrl || res.data?.paymentUrl;
            const formData = res.formData || res.data?.formData;

            if (!res.success || !paymentUrl || !formData) {
                throw new Error(res.message || 'Failed to initiate payment');
            }

            // Build and auto-submit a hidden form to PayU
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = paymentUrl;
            form.target = '_self';

            Object.entries(formData).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = String(value);
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch (err: any) {
            setError(err.message || 'Payment initiation failed. Please try again.');
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">My Wallet</h1>
                <p className="text-gray-600">Manage your whitelabel balance and usage credits</p>
            </div>

            {/* Payment Status Banner */}
            {paymentStatus === 'success' && (
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl px-6 py-4 font-semibold">
                    <CheckCircle2 className="text-teal-600 shrink-0" size={22} />
                    Payment successful! Your balance has been updated.
                </div>
            )}
            {(paymentStatus === 'failed' || paymentStatus === 'cancelled') && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl px-6 py-4 font-semibold">
                    <XCircle className="text-red-500 shrink-0" size={22} />
                    {paymentStatus === 'cancelled' ? 'Payment was cancelled.' : 'Payment failed. Please try again.'}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 rounded-2xl px-6 py-4 font-semibold">
                    <AlertCircle className="text-red-500 shrink-0" size={22} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance Summary */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-teal-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                            <h3 className="text-teal-100 font-bold uppercase tracking-wider text-sm mb-2">Available Balance</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black">₹{balance.toLocaleString('en-IN')}</span>
                                <span className="text-teal-200 font-medium">INR</span>
                            </div>
                            <div className="mt-8 flex items-center gap-2 text-teal-100 text-sm bg-black/10 w-fit px-3 py-1.5 rounded-full">
                                <TrendingUp size={16} />
                                Synchronized with Hub
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-2">Usage Credits</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-gray-900">{credits.toLocaleString('en-IN')}</span>
                                    <span className="text-gray-400 font-medium whitespace-nowrap">Units</span>
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-teal-50 rounded-2xl flex items-center gap-3">
                                <Zap className="text-teal-600" size={24} />
                                <p className="text-xs text-teal-800 leading-relaxed font-semibold">
                                    Consumed as sub-users interact with voice agents.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <History size={20} className="text-teal-600" />
                                Transaction History
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {transactions.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 font-medium">
                                    No transactions yet. Top up your wallet to get started.
                                </div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.status === 'success' ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'}`}>
                                                <ArrowUpRight size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">Top-up via PayU</p>
                                                <p className="text-sm text-gray-400 font-medium">
                                                    {new Date(tx.createdAt).toLocaleString('en-IN')}
                                                    {tx.txnid && <span className="ml-2 text-gray-300">· {tx.txnid}</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${tx.status === 'success' ? 'text-teal-600' : 'text-gray-400'}`}>
                                                + ₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                                            </p>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter ${tx.status === 'success' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Up Section */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>

                        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                            <Plus size={24} className="text-teal-500" />
                            Top Up Balance
                        </h2>

                        <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-400 ml-1">Select Amount (INR)</label>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {['1000', '5000', '10000', '25000'].map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setTopUpAmount(amt)}
                                        className={`py-3 rounded-2xl font-black transition-all border-2 ${topUpAmount === amt
                                            ? 'bg-teal-600 border-teal-600 text-white'
                                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-teal-500'
                                            }`}
                                    >
                                        ₹{parseInt(amt).toLocaleString('en-IN')}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                <input
                                    type="number"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    className="w-full h-14 bg-gray-800 border-2 border-gray-700 rounded-2xl pl-8 pr-4 text-white font-black text-xl focus:border-teal-500 outline-none transition-all"
                                    placeholder="Other amount"
                                    min="1"
                                />
                            </div>

                            <button
                                onClick={handleTopUp}
                                disabled={isProcessing}
                                className="w-full h-16 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-900/40"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Redirecting to PayU...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={20} />
                                        Buy Now
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-xs text-center text-gray-500 font-medium">
                                Secured via PayU Payment Gateway.
                                You will be redirected to PayU to complete payment.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle size={18} className="text-teal-500" />
                            Whitelabel Policy
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                            Balance topped up here is added to your Master Hub account. This balance is used when you provision credits to your sub-users.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function WalletPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
            </div>
        }>
            <WalletContent />
        </Suspense>
    );
}
