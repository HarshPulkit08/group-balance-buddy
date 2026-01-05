import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
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
            where('createdBy', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const g = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as Timestamp).toDate(),
            } as Group));
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
            userId: user.uid
        };

        const newGroup = {
            name,
            description: description || '',
            createdAt: Timestamp.now(),
            createdBy: user.uid,
            members: [initialMember],
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

    return {
        groups,
        loading,
        createGroup,
        deleteGroup,
        updateGroupStatus,
    };
}
