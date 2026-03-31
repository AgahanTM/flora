import { apiClient } from './client';
import { IssueReportInput } from '../types/report';

export const reportApi = {
  submitReport: (data: IssueReportInput) => apiClient.post('/issue-reports', data),
};
