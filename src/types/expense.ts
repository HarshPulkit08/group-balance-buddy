export interface Member {
  id: string;
  name: string;
  balance: number;
  avatar?: string;
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number;
  note: string;
  createdAt: Date;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}
