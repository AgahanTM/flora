import { MetadataRoute } from 'next';
import { apiClient } from '@/lib/api/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://flora.tm';

  // Base routes
  const routes = [
    '',
    '/products',
    '/occasions',
    '/gift-builder',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic products
  let products: any[] = [];
  try {
    const { data } = await apiClient.get('/products', { params: { limit: 100 } });
    products = data.data || [];
  } catch (e) {
    console.error('Sitemap: Failed to fetch products');
  }

  const productRoutes = products.map((p) => ({
    url: `${baseUrl}/products/${p.id}`,
    lastModified: new Date(p.updated_at || p.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dynamic sellers
  let sellers: any[] = [];
  try {
    const { data } = await apiClient.get('/sellers', { params: { status: 'approved' } });
    sellers = data.data || [];
  } catch (e) {
    console.error('Sitemap: Failed to fetch sellers');
  }

  const sellerRoutes = sellers.map((s) => ({
    url: `${baseUrl}/sellers/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...routes, ...productRoutes, ...sellerRoutes];
}
