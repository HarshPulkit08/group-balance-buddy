export interface Member {
  id: string;
  name: string;
  balance: number;
  avatar?: string;
  userId?: string; // Optional: link to a registered user
  upiId?: string;
  email?: string;
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  note: string;
  createdAt: Date;
  receiptUrl?: string;
  categoryId?: string;
  type?: 'expense' | 'settlement';
  relatedMemberId?: string; // For settlements: who received the money
  splitType?: 'equal' | 'unequal';
  splits?: Record<string, number>; // map of memberId -> amount owed
}

export interface Settlement {
  from: string;
  fromId: string;
  to: string;
  toId: string;
  amount: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string; // userId
  members: Member[];
  memberEmails: string[]; // For querying groups by member email
  expenses: Expense[];
  isSettled: boolean;
  type: 'trip' | 'household';
  budget?: number; // Monthly budget limit for households
}

export type Category = {
  id: string;
  name: string;
  icon: string;
};
