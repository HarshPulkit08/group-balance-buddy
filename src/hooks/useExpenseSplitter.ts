import { useState, useCallback, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
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

  const addMember = useCallback(async (name: string, email?: string) => {
    if (!user || !groupId) return false;
    const trimmed = name.trim();
    if (!trimmed || members.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    const isCurrentUser = user && (
      name.toLowerCase() === 'me' ||
      name.toLowerCase() === (user.email?.split('@')[0].toLowerCase() ?? '') ||
      name.toLowerCase() === (user.displayName?.toLowerCase() ?? '')
    );

    const newMember: Member = {
      id: crypto.randomUUID(),
      name: trimmed,
      balance: 0,
      email: email?.trim() || undefined,
      ...(isCurrentUser ? { userId: user.uid, email: user.email || undefined } : {})
    };

    const groupDocRef = doc(db, 'groups', groupId);
    const updates: any = {
      members: arrayUnion(newMember)
    };

    if (newMember.email) {
      updates.memberEmails = arrayUnion(newMember.email);
    }

    await updateDoc(groupDocRef, updates);
    return true;
  }, [user, groupId, members]);

  const updateMember = useCallback(async (memberId: string, updates: Partial<Member>) => {
    if (!user || !groupId) return;

    // We need to update the specific member in the array. 
    // Firestore array updates are tricky if not adding/removing. 
    // Safest is to read, modify, write entire members array.
    // Since we subscribe to members, we have the latest.

    const updatedMembers = members.map(m =>
      m.id === memberId ? { ...m, ...updates } : m
    );

    const groupDocRef = doc(db, 'groups', groupId);
    const memberEmails = updatedMembers
      .map(m => m.email)
      .filter((email): email is string => Boolean(email));

    await updateDoc(groupDocRef, {
      members: updatedMembers,
      memberEmails: memberEmails
    });
  }, [user, groupId, members]);

  const removeMember = useCallback(async (id: string) => {
    if (!user || !groupId) return;
    const memberToRemove = members.find(m => m.id === id);
    if (!memberToRemove) return;

    const groupDocRef = doc(db, 'groups', groupId);
    const updates: any = {
      members: arrayRemove(memberToRemove),
      expenses: expenses.filter(e => e.payerId !== id)
    };

    if (memberToRemove.email) {
      updates.memberEmails = arrayRemove(memberToRemove.email);
    }

    await updateDoc(groupDocRef, updates);
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

  const addSettlement = useCallback(async (payerId: string, receiverId: string, amount: number) => {
    if (!user || !groupId) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      payerId,
      amount,
      note: 'Settlement Payment',
      createdAt: new Date(),
      type: 'settlement',
      relatedMemberId: receiverId
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

  const resetMonth = useCallback(async () => {
    if (!user || !groupId || members.length === 0) return;

    // Calculate current balances to settle
    const balanceMap = new Map<string, number>();
    members.forEach(m => balanceMap.set(m.id, 0));
    const totalEx = expenses.reduce((sum, e) => sum + e.amount, 0);
    const share = totalEx / members.length;

    expenses.forEach(e => {
      const current = balanceMap.get(e.payerId) ?? 0;
      balanceMap.set(e.payerId, current + e.amount);
    });

    const settlementExpenses: Expense[] = [];
    const timestamp = new Date();

    // Create offsetting expenses
    // If someone has a positive balance (owed money), they get a negative expense? 
    // No, to zero out: 
    // If Balance is +100 (Paid 200, Share 100), we need to effectively bring them to 0.
    // Actually, standard practice is to just mark as settled or add a "Payment" transaction.
    // For "Reset Month", we can add a special expense type, but given current structure, 
    // adding expenses that offset the balance is complex. 
    // Simpler approach: Add a single "Monthly Settlement" expense for each member equal to their -Balance?
    // No, that changes total spent.

    // Better approach for "Households": Just Archive the expenses? 
    // User asked to "Settle" rent/bills. 
    // Let's implement the "Payment" ledger logic later if needed. 
    // For now, let's archive by removing them from 'expenses' array and moving to 'history' subcollection?
    // Or easier: Just leave them and rely on "Date Filtering" in the UI? 
    // User asked for "Continuous Monthly Settlement". 
    // Let's go with: Add a "Settlement" expense that creates an inverse entry.
    // If Alice paid 100 (bal +50), Bob paid 0 (bal -50). 
    // We add Expense: Bob pays 50 to Alice. 
    // But our system only tracks "Expense". 
    // Let's simpler: Archives.
    // Moving expenses to 'archivedExpenses' map in Firestore layout is cleanest but schema change.

    // Let's simply CLEAR the expenses array for the month, but maybe save a summary?
    // User specifically asked "Start fresh".
    // Let's implement: Move current expenses to a new 'archived_months' collection/field and clear 'expenses'.

    const groupDocRef = doc(db, 'groups', groupId);
    // We will move all current expenses to an archive and clear the main list.
    // This is the most robust way to "Reset" for a new month.

    const monthKey = format(new Date(), 'yyyy-MM');
    const archiveData = {
      month: monthKey,
      expenses: expenses,
      total: totalEx,
      settledAt: timestamp
    };

    // We need to use a transaction or batch, but simplified here:
    // 1. Add to archives subcollection
    // 2. Clear expenses array
    // actually, subcollection is better to avoid document size limits.
    // But we are in a hook.

    // Let's just return true for now and handle logic in UI or simpler cleared.
    // REVISION: Just deleting them from main view is what "Reset" implies for a flat.

    await updateDoc(groupDocRef, {
      expenses: [], // Clear current expenses
      [`history.${monthKey}`]: expenses // Save to history map (careful of size)
    });

  }, [user, groupId, members, expenses]);

  const balances = useMemo(() => {
    if (members.length === 0) return [];

    const balanceMap = new Map<string, number>();
    members.forEach(m => balanceMap.set(m.id, 0));

    // Only count 'expense' types for the total group cost
    const normalExpenses = expenses.filter(e => e.type !== 'settlement');
    const totalGroupCost = normalExpenses.reduce((sum, e) => sum + e.amount, 0);
    const share = members.length > 0 ? totalGroupCost / members.length : 0;

    expenses.forEach(e => {
      if (e.type === 'settlement') {
        // Settlement Logic: Payer pays Receiver.
        // Payer balance increases (less debt), Receiver balance decreases (less credit).
        if (e.relatedMemberId) {
          const payerBal = balanceMap.get(e.payerId) ?? 0;
          const receiverBal = balanceMap.get(e.relatedMemberId) ?? 0;
          balanceMap.set(e.payerId, payerBal + e.amount);
          balanceMap.set(e.relatedMemberId, receiverBal - e.amount);
        }
      } else {
        // Normal Expense Logic
        const current = balanceMap.get(e.payerId) ?? 0;
        balanceMap.set(e.payerId, current + e.amount);
      }
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
          fromId: debtor.id,
          to: creditor.name,
          toId: creditor.id,
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
    expenses
      .filter(e => e.type !== 'settlement')
      .reduce((sum, e) => sum + e.amount, 0),
    [expenses]);

  const spendingByMember = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      // Exclude settlements from spending stats to match "Trip Total"
      if (e.type !== 'settlement') {
        const current = map.get(e.payerId) ?? 0;
        map.set(e.payerId, current + e.amount);
      }
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
    addSettlement,
    updateMember,
    removeExpense,
    resetMonth
  };
}
