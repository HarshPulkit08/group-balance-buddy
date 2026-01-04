export interface Member {
  id: string;
  name: string;
  balance: number;
  avatar?: string;
  userId?: string; // Optional: link to a registered user
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  note: string;
  createdAt: Date;
  receiptUrl?: string;
  categoryId?: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string; // userId
  members: Member[];
  expenses: Expense[];
  isSettled: boolean;
}

export type Category = {
  id: string;
  name: string;
  icon: string;
};
