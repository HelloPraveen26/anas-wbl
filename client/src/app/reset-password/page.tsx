'use client';

import { Suspense } from 'react';
import ResetPasswordContent from './ResetPasswordContent';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="h-screen w-full flex items-center justify-center bg-white">
                    <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm">Loading...</p>
                    </div>
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
