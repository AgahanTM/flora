import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { publicApi } from '@/lib/api/public';
import { PublicSellerProfile } from '@/lib/types/seller';
import PublicSellerStorefront from '@/components/seller/PublicSellerStorefront';

interface PublicSellersSlugPageProps {
  params: { slug: string };
}

async function getSeller(slug: string): Promise<PublicSellerProfile | null> {
  try {
    const { data } = await publicApi.getSellerProfile(slug);
    // Safety check: only show approved sellers
    if (data.status !== 'approved') return null;
    return data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<PublicSellersSlugPageProps['params']> }): Promise<Metadata> {
  const { slug } = await params;
  const seller = await getSeller(slug);
  
  if (!seller) {
    return {
      title: 'Seller Not Found | Flora',
    };
  }

  return {
    title: `${seller.shop_name} | Premium Flora Shop`,
    description: seller.description || `Browse beautiful flowers and gifts from ${seller.shop_name} on Flora.`,
    openGraph: {
      title: seller.shop_name,
      description: seller.description,
      images: seller.cover_url ? [{ url: seller.cover_url }] : [],
    },
  };
}

export default async function PublicSellersSlugPage({ params }: { params: Promise<PublicSellersSlugPageProps['params']> }) {
  const { slug } = await params;
  const seller = await getSeller(slug);

  if (!seller) {
    notFound();
  }

  return <PublicSellerStorefront initialSeller={seller} />;
}
