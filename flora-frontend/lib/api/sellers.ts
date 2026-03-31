import { apiClient } from './client';

// Seller API functions
export const sellerApi = {
  // Profile
  getProfile: () => apiClient.get('/seller/profile'),
  updateProfile: (data: any) => apiClient.put('/seller/profile', data),

  // Products
  getProducts: () => apiClient.get('/seller/products'),
  getProduct: (id: string) => apiClient.get(`/seller/products/${id}`),
  createProduct: (data: any) => apiClient.post('/seller/products', data),
  updateProduct: (id: string, data: any) => apiClient.put(`/seller/products/${id}`, data),
  deleteProduct: (id: string) => apiClient.delete(`/seller/products/${id}`),
  getLowStockProducts: () => apiClient.get('/seller/products/low-stock'),

  // Orders
  getOrders: (params?: any) => apiClient.get('/seller/orders', { params }),
  getOrder: (id: string) => apiClient.get(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => apiClient.put(`/orders/${id}/status`, { status }),

  // Reviews
  getReviews: () => apiClient.get('/seller/reviews'),
  respondToReview: (reviewId: string, response: string) =>
    apiClient.put(`/reviews/${reviewId}/respond`, { response }),

  // Documents (KYC)
  submitDocument: (data: { document_type: string; file_url: string }) =>
    apiClient.post('/seller/documents', data),

  // Bank Details
  updateBankDetails: (data: any) => apiClient.put('/seller/bank-details', data),

  // Working Hours
  updateWorkingHours: (schedules: any[]) =>
    apiClient.put('/seller/working-hours', { schedules }),

  // Delivery Zones
  updateDeliveryZones: (zone_ids: string[]) =>
    apiClient.put('/seller/delivery-zones', { zone_ids }),

  // Delivery Time Slots
  getDeliverySlots: () => apiClient.get('/seller/delivery/time-slots'),
  createDeliverySlot: (data: any) => apiClient.post('/seller/delivery/time-slots', data),
  deleteDeliverySlot: (id: string) => apiClient.delete(`/seller/delivery/time-slots/${id}`),
};
