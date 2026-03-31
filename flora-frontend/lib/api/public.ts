import { apiClient } from './client';
import { PublicSellerProfile } from '../types/seller';

export const publicApi = {
  getSellerProfile: (idOrSlug: string) => 
    apiClient.get(`/sellers/${idOrSlug}`),
  
  getSellerProducts: (sellerId: string, params?: any) => 
    apiClient.get('/products', { params: { ...params, seller_id: sellerId } }),
    
  getProductReviews: (productId: string) => 
    apiClient.get(`/products/${productId}/reviews`),
};
