import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-cream">
      {/* Left split screen - Graphic (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-rose-dark/5">
        <div className="relative z-10 w-fit">
          <Link href="/" className="flex items-center gap-2 group">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-rose group-hover:text-rose-dark transition-colors" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C12 22 17 18 17 12C17 6 12 2 12 2C12 2 7 6 7 12C7 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 11V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15C9 15 9 18 12 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15C15 15 15 18 12 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-display font-bold text-4xl tracking-tight text-bark pt-1">Flora</span>
          </Link>
        </div>
        
        <div className="relative z-10 mt-auto mb-12 max-w-lg">
          <h1 className="text-5xl font-display font-semibold text-bark leading-tight mb-6">
            Send love, <br/>
            <span className="text-rose font-accent font-normal italic pr-2">one bloom</span> at a time.
          </h1>
          <p className="text-bark/80 text-lg">
            Join Turkmenistan's finest platform for romantic bouquets, personalized gifts, and memorable experiences.
          </p>
        </div>

        {/* Decorative floral elements */}
        <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-rose rounded-full mix-blend-multiply filter blur-[100px] opacity-20 animate-pulse"></div>
        <div className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-sage rounded-full mix-blend-multiply filter blur-[80px] opacity-20"></div>
      </div>

      {/* Right split screen - Form */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 lg:px-16 bg-white shadow-soft relative z-20">
        <Link href="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-rose" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 17 18 17 12C17 6 12 2 12 2C12 2 7 6 7 12C7 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-display font-bold text-2xl tracking-tight text-bark">Flora</span>
        </Link>
        
        <div className="w-full max-w-sm mt-8 lg:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
