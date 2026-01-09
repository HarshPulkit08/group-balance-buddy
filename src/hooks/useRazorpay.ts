import { useState, useEffect } from 'react';

interface RazorpayOptions {
    key: string;
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

        const rzp = new (window as any).Razorpay(options);

        if (onFailure) {
            rzp.on('payment.failed', function (response: any) {
                onFailure(response.error);
            });
        }

        rzp.open();
    };

    return { isLoaded, openRazorpay };
};
