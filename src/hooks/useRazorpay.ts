import { useState, useEffect } from 'react';

interface RazorpayOptions {
    key?: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image?: string;
    order_id?: string;
    handler: (response: any) => void;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color: string;
    };
    retry?: {
        enabled: boolean;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

export const useRazorpay = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setIsLoaded(true);
        script.onerror = () => setIsLoaded(false);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const openRazorpay = (options: RazorpayOptions, onFailure?: (error: any) => void) => {
        if (!isLoaded) {
            console.error('Razorpay SDK not loaded');
            return;
        }

        // Use key from options or fallback to env variable
        const rzpOptions = {
            ...options,
            key: options.key || import.meta.env.VITE_RAZORPAY_KEY_ID
        };

        if (!rzpOptions.key) {
            console.error('Razorpay Key ID is missing. Please set VITE_RAZORPAY_KEY_ID in .env');
            if (onFailure) onFailure({ error: { description: 'Configuration Error: Missing Razorpay Key' } });
            return;
        }

        const rzp = new (window as any).Razorpay(rzpOptions);

        if (onFailure) {
            rzp.on('payment.failed', function (response: any) {
                onFailure(response.error);
            });
        }

        rzp.open();
    };

    return { isLoaded, openRazorpay };
};
