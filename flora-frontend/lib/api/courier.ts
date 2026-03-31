import { apiClient } from './client';
import { Delivery } from '../types/courier';

export const courierApi = {
  getDeliveries: (status?: string) => 
    apiClient.get('/courier/deliveries', { params: { status } }),
  
  getDelivery: (id: string) => 
    apiClient.get(`/courier/deliveries/${id}`),

  processDelivery: (id: string, status: string, notes?: string) => 
    apiClient.put(`/courier/deliveries/${id}/process`, { status, notes }),

  updateLocation: (latitude: number, longitude: number) => 
    apiClient.put('/courier/location', { latitude, longitude }),
};
