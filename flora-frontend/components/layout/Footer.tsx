import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-cream text-bark border-t border-border bg-floral-texture py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-rose group-hover:text-rose-dark transition-colors" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C12 22 17 18 17 12C17 6 12 2 12 2C12 2 7 6 7 12C7 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15C9 15 9 18 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15C15 15 15 18 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-display font-bold text-3xl tracking-tight text-bark pt-1">Flora</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-bark/80">
              Send love, one bloom at a time. A soft, romantic boutique for flowers and personalized gifts in Turkmenistan.
            </p>
            <div className="flex gap-4 mt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-rose hover:text-white transition-colors border border-border">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-rose hover:text-white transition-colors border border-border">
                <span className="sr-only">TikTok</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-6">Shop</h3>
            <ul className="space-y-4">
              <li><Link href="/products?category=bouquets" className="text-sm hover:text-rose transition-colors">Fresh Bouquets</Link></li>
              <li><Link href="/products?category=chocolates" className="text-sm hover:text-rose transition-colors">Premium Chocolates</Link></li>
              <li><Link href="/products?category=plants" className="text-sm hover:text-rose transition-colors">House Plants</Link></li>
              <li><Link href="/gift-builder" className="text-sm hover:text-rose transition-colors text-rose-dark font-medium">Custom Gift Builder</Link></li>
              <li><Link href="/occasions" className="text-sm hover:text-rose transition-colors">Shop by Occasion</Link></li>
            </ul>
          </div>

          {/* Help Column */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-6">Help & Support</h3>
            <ul className="space-y-4">
              <li><Link href="/faq" className="text-sm hover:text-rose transition-colors">FAQ</Link></li>
              <li><Link href="/track-order" className="text-sm hover:text-rose transition-colors">Track Order</Link></li>
              <li><Link href="/delivery-info" className="text-sm hover:text-rose transition-colors">Delivery Information</Link></li>
              <li><Link href="/returns" className="text-sm hover:text-rose transition-colors">Refund Policy</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-rose transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal / Sellers Column */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-6">Partners & Legal</h3>
            <ul className="space-y-4">
              <li><Link href="/seller/register" className="text-sm hover:text-rose transition-colors font-medium">Become a Partner Shop</Link></li>
              <li><Link href="/courier/register" className="text-sm hover:text-rose transition-colors">Drive with Us</Link></li>
              <li><Link href="/terms" className="text-sm hover:text-rose transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm hover:text-rose transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-bark/60">
            &copy; {currentYear} Flora E-commerce. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-bark/60">
            <span>Turkmenistan</span>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span>English</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
