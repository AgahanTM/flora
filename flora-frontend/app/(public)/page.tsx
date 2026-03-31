import { BannerCarousel } from '@/components/home/BannerCarousel';
import { OccasionsGrid } from '@/components/home/OccasionsGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { HowItWorks } from '@/components/home/HowItWorks';
import { MidBanner } from '@/components/home/MidBanner';
import { SubscriptionsTeaser } from '@/components/home/SubscriptionsTeaser';
import { PersonalizationTeaser } from '@/components/home/PersonalizationTeaser';
import { Testimonials } from '@/components/home/Testimonials';

export const metadata = {
  title: 'Flora — Fresh Flowers & Gifts in Turkmenistan',
  description: 'Shop premium curated flower bouquets, chocolates, and personalized gifts in Turkmenistan. Same-day delivery available. Enhance your bouquets with custom 3D prints or laser engravings.',
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <BannerCarousel />
      <OccasionsGrid />
      <HowItWorks />
      <FeaturedProducts />
      <MidBanner />
      <PersonalizationTeaser />
      <SubscriptionsTeaser />
      <Testimonials />
    </div>
  );
}
