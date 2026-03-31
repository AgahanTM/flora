import { apiClient } from './client';
import { OrderStatus } from '../types/api';
import { Category } from '../types/product';
import { Occasion } from '../types/occasion';
import { PromotionCreateInput } from '../types/promotion';
import { BannerCreateInput } from '../types/banner';
import { PersonalizationTemplate } from '../types/personalization';
import { Courier } from '../types/courier';
import { DeliveryZone } from '../types/admin_system';

// Admin API functions
export const adminApi = {
  // Orders
  getOrders: (params?: any) => apiClient.get('/admin/orders', { params }),
  updateOrderStatus: (id: string, status: OrderStatus, note?: string) => 
    apiClient.put(`/orders/${id}/status`, { status, note }),

  // Payments & Bank Proofs
  getBankProofs: (status: string = 'pending') => apiClient.get('/admin/bank-proofs', { params: { status } }),
  approveBankProof: (id: string) => apiClient.put(`/admin/payments/${id}/approve-proof`),
  rejectBankProof: (id: string, reason: string) => apiClient.put(`/admin/payments/${id}/reject-proof`, { reason }),

  // Refunds
  getRefunds: (status: string = 'pending') => apiClient.get('/admin/refunds', { params: { status } }),
  processRefund: (id: string, approve: boolean) => apiClient.put(`/admin/payments/refunds/${id}/process`, { approve }),

  // Products
  toggleProductFeatured: (id: string, is_featured: boolean) => apiClient.put(`/admin/products/${id}/featured`, { is_featured }),
  
  // Categories
  getCategories: () => apiClient.get('/admin/categories'),
  createCategory: (data: Partial<Category>) => apiClient.post('/admin/categories', data),
  
  // Occasions
  createOccasion: (data: Partial<Occasion>) => apiClient.post('/admin/occasions', data),

  // Promotions
  getPromotions: () => apiClient.get('/admin/promotions'),
  createPromotion: (data: PromotionCreateInput) => apiClient.post('/admin/promotions', data),

  // Banners
  getBanners: () => apiClient.get('/admin/banners'),
  createBanner: (data: BannerCreateInput) => apiClient.post('/admin/banners', data),
  updateBanner: (id: string, data: Partial<BannerCreateInput>) => apiClient.put(`/admin/banners/${id}`, data),
  deleteBanner: (id: string) => apiClient.delete(`/admin/banners/${id}`),

  // Personalization Templates
  createPersonalizationTemplate: (data: Partial<PersonalizationTemplate>) => 
    apiClient.post('/admin/personalization/templates', data),

  // Couriers & Logistics
  getCouriers: () => apiClient.get('/admin/couriers'),
  createCourier: (data: Partial<Courier>) => apiClient.post('/admin/couriers', data),
  assignDelivery: (deliveryId: string, courierId: string) => 
    apiClient.put(`/admin/deliveries/${deliveryId}/assign`, { courierId }),
  getDeliveryZones: () => apiClient.get('/admin/delivery/zones'),
  createDeliveryZone: (data: Partial<DeliveryZone>) => apiClient.post('/admin/delivery/zones', data),

  // Analytics
  getDailyAnalytics: (date: string) => apiClient.get('/admin/analytics/daily', { params: { date } }),
  getSellerAnalytics: (date: string) => apiClient.get('/admin/analytics/seller', { params: { date } }),

  // Settings & Logs
  getSettings: () => apiClient.get('/admin/settings'),
  updateSetting: (key: string, value: string) => apiClient.put('/admin/settings', { key, value }),
  getLogs: (params?: any) => apiClient.get('/admin/logs', { params }),

  // Issue Reports
  getIssueReports: (status?: string) => apiClient.get('/admin/issue-reports', { params: { status } }),
  updateIssueReportStatus: (id: string, status: string, admin_note?: string) => 
    apiClient.put(`/admin/issue-reports/${id}/status`, { status, admin_note }),
};
