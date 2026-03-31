import { IssueReportStatus } from './api';

export type IssueType = 'defective_product' | 'late_delivery' | 'wrong_item' | 'other';

export interface IssueReport {
  id: string;
  user_id: string;
  order_id?: string;
  product_id?: string;
  review_id?: string;
  issue_type: IssueType;
  description: string;
  status: IssueReportStatus;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export interface IssueReportInput {
  issue_type: IssueType;
  description: string;
  order_id?: string;
  product_id?: string;
  review_id?: string;
}
