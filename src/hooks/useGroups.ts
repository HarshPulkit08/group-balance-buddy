import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, or } from 'firebase/firestore';
import { Group, Member } from '@/types/expense';
import { useAuth } from '@/components/AuthContext';

export function useGroups() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'groups'),
            or(
                where('createdBy', '==', user.uid),
                where('memberEmails', 'array-contains', user.email)
            )
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const g = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp).toDate(),
                    expenses: ((data.expenses || []) as any[]).map(e => ({
                        ...e,
                        createdAt: e.createdAt instanceof Timestamp ? e.createdAt.toDate() : new Date(e.createdAt || Date.now())
                    })),
                } as Group;
            });
            setGroups(g);
            setLoading(false);
        });

        return unsubscribe;
    }, [user]);

    const createGroup = useCallback(async (name: string, description?: string, type: 'trip' | 'household' = 'trip') => {
        if (!user) return;

        const initialMember: Member = {
            id: crypto.randomUUID(),
            name: user.displayName || user.email?.split('@')[0] || 'Me',
            balance: 0,
            userId: user.uid,
            email: user.email || undefined
        };

        const newGroup = {
            name,
            description: description || '',
            createdAt: Timestamp.now(),
            createdBy: user.uid,
            members: [initialMember],
            memberEmails: user.email ? [user.email] : [],
            expenses: [],
            isSettled: false,
            type
        };

        await addDoc(collection(db, 'groups'), newGroup);
    }, [user]);

    const deleteGroup = useCallback(async (groupId: string) => {
        await deleteDoc(doc(db, 'groups', groupId));
    }, []);

    const updateGroupStatus = useCallback(async (groupId: string, isSettled: boolean) => {
        await updateDoc(doc(db, 'groups', groupId), { isSettled });
    }, []);

    const updateGroupBudget = useCallback(async (groupId: string, budget: number) => {
        await updateDoc(doc(db, 'groups', groupId), { budget });
    }, []);

    return {
        groups,
        loading,
        createGroup,
        deleteGroup,
        updateGroupStatus,
        updateGroupBudget,
    };
}
