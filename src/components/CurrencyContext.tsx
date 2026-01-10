import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = '₹' | '$' | '€' | '£' | '¥';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<Currency>('₹');

    useEffect(() => {
        const saved = localStorage.getItem('currency') as Currency;
        if (saved && ['₹', '$', '€', '£', '¥'].includes(saved)) {
            setCurrencyState(saved);
        }
    }, []);

    const setCurrency = (c: Currency) => {
        setCurrencyState(c);
        localStorage.setItem('currency', c);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const currencies: Currency[] = ['₹', '$', '€', '£', '¥'];
