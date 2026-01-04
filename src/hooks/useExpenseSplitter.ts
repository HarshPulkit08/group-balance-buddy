import { useState, useCallback, useMemo, useEffect } from 'react';
import { Member, Expense, Settlement } from '@/types/expense';
import { useAuth } from '@/components/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, collection } from 'firebase/firestore';

export function useExpenseSplitter(groupId?: string) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync data from Firestore
  useEffect(() => {
    if (!user || !groupId) return;

    const groupDocRef = doc(db, 'groups', groupId);
    const unsubscribe = onSnapshot(groupDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMembers(data.members || []);
        setExpenses((data.expenses || []).map((e: any) => ({
          ...e,
          createdAt: e.createdAt?.toDate() || new Date(),
        })));
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user, groupId]);

  const addMember = useCallback(async (name: string) => {
    if (!user || !groupId) return false;
    const trimmed = name.trim();
    if (!trimmed || members.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    const newMember: Member = {
      id: crypto.randomUUID(),
      name: trimmed,
      balance: 0,
    };

    const groupDocRef = doc(db, 'groups', groupId);
    await updateDoc(groupDocRef, {
      members: arrayUnion(newMember)
    });
    return true;
  }, [user, groupId, members]);

  const removeMember = useCallback(async (id: string) => {
    if (!user || !groupId) return;
    const memberToRemove = members.find(m => m.id === id);
    if (!memberToRemove) return;

    const groupDocRef = doc(db, 'groups', groupId);
    await updateDoc(groupDocRef, {
      members: arrayRemove(memberToRemove),
      expenses: expenses.filter(e => e.payerId !== id)
    });
  }, [user, groupId, members, expenses]);

  const addExpense = useCallback(async (payerId: string, amount: number, note: string, receiptUrl?: string) => {
    if (!user || !groupId) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      payerId,
      amount,
      note: note.trim(),
      createdAt: new Date(),
      ...(receiptUrl ? { receiptUrl } : {}),
    };

    const groupDocRef = doc(db, 'groups', groupId);
    await updateDoc(groupDocRef, {
      expenses: arrayUnion(newExpense)
    });
  }, [user, groupId]);

  const editExpense = useCallback(async (id: string, payerId: string, amount: number, note: string, receiptUrl?: string) => {
    if (!user || !groupId) return;
    const updatedExpenses = expenses.map(e =>
      e.id === id ? { ...e, payerId, amount, note: note.trim(), receiptUrl: receiptUrl || e.receiptUrl || "" } : e
    );
    // Remove empty string keys before saving if needed, but Firestore handles empty strings.
    // However, it's safer to avoid undefined.

    const groupDocRef = doc(db, 'groups', groupId);
    await updateDoc(groupDocRef, {
      expenses: updatedExpenses
    });
  }, [user, groupId, expenses]);

  const removeExpense = useCallback(async (id: string) => {
    if (!user || !groupId) return;
    const expenseToRemove = expenses.find(e => e.id === id);
    if (!expenseToRemove) return;

    const groupDocRef = doc(db, 'groups', groupId);
    await updateDoc(groupDocRef, {
      expenses: arrayRemove(expenseToRemove)
    });
  }, [user, groupId, expenses]);

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
    loading,
    addMember,
    removeMember,
    addExpense,
    editExpense,
    removeExpense,
  };
}
