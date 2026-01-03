import { useState, useCallback, useMemo } from 'react';
import { Member, Expense, Settlement } from '@/types/expense';

export function useExpenseSplitter() {
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const addMember = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || members.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    const newMember: Member = {
      id: crypto.randomUUID(),
      name: trimmed,
      balance: 0,
    };
    setMembers(prev => [...prev, newMember]);
    return true;
  }, [members]);

  const removeMember = useCallback((id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setExpenses(prev => prev.filter(e => e.payerId !== id));
  }, []);

  const addExpense = useCallback((payerId: string, amount: number, note: string) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      payerId,
      amount,
      note: note.trim(),
      createdAt: new Date(),
    };
    setExpenses(prev => [...prev, newExpense]);
  }, []);

  const editExpense = useCallback((id: string, payerId: string, amount: number, note: string) => {
    setExpenses(prev => prev.map(e => 
      e.id === id ? { ...e, payerId, amount, note: note.trim() } : e
    ));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const balances = useMemo(() => {
    if (members.length === 0) return [];

    const balanceMap = new Map<string, number>();
    members.forEach(m => balanceMap.set(m.id, 0));

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const share = members.length > 0 ? totalExpenses / members.length : 0;

    expenses.forEach(e => {
      const current = balanceMap.get(e.payerId) ?? 0;
      balanceMap.set(e.payerId, current + e.amount);
    });

    return members.map(m => ({
      ...m,
      balance: (balanceMap.get(m.id) ?? 0) - share,
    }));
  }, [members, expenses]);

  const settlements = useMemo((): Settlement[] => {
    const result: Settlement[] = [];
    const debtors: { id: string; name: string; amount: number }[] = [];
    const creditors: { id: string; name: string; amount: number }[] = [];

    balances.forEach(b => {
      if (b.balance < -0.01) {
        debtors.push({ id: b.id, name: b.name, amount: -b.balance });
      } else if (b.balance > 0.01) {
        creditors.push({ id: b.id, name: b.name, amount: b.balance });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        result.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount * 100) / 100,
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return result;
  }, [balances]);

  const totalSpent = useMemo(() => 
    expenses.reduce((sum, e) => sum + e.amount, 0),
  [expenses]);

  const spendingByMember = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      const current = map.get(e.payerId) ?? 0;
      map.set(e.payerId, current + e.amount);
    });
    return members.map(m => ({
      name: m.name,
      amount: map.get(m.id) ?? 0,
    }));
  }, [members, expenses]);

  return {
    members,
    expenses,
    balances,
    settlements,
    totalSpent,
    spendingByMember,
    addMember,
    removeMember,
    addExpense,
    editExpense,
    removeExpense,
  };
}
