import { PaymentMethod, PaymentStatus } from './api';

export interface Payment {
  id: string;
  order_id: string;
  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref?: string;
  processed_at?: string;
  created_at: string;
}

export interface BankTransferProof {
  id: string;
  payment_id: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  uploaded_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Refund {
  id: string;
  payment_id: string;
  amount: string;
  reason: string;
  status: 'pending' | 'processed' | 'failed';
  processed_at?: string;
  created_at: string;
}
