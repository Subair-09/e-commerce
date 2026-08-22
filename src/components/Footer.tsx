import React, { useState } from 'react';
import { ArrowRight, Check, Mail, ShieldCheck, Database, Cloud } from 'lucide-react';
import { subscribeNewsletterInMongo } from '../services/mongoService';

interface FooterProps {
  onSelectCategory: (categoryName: string) => void;
  onShowToast: (title: string, msg: string) => void;
  onOpenAzureStorage?: () => void;
  onOpenMongoDatabase?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenAdminDashboard?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onSelectCategory, 
  onShowToast, 
  onOpenAzureStorage,
  onOpenMongoDatabase,
  onOpenAdminLogin,
  onOpenAdminDashboard,
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      onShowToast('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      const res = await subscribeNewsletterInMongo(email.trim(), 'footer_form');
      if (res.success) {
        setSubscribed(true);
        onShowToast('Subscribed!', 'Welcome! 15% discount code (AURA15-WELCOME) saved to MongoDB.');
        setEmail('');
      } else {
        onShowToast('Subscription Notice', 'Subscribed with default promo code.');
      }
    } catch {
      setSubscribed(true);
      onShowToast('Subscribed!', 'You will receive 15% off your first order.');
      setEmail('');
    }
  };

  return (
    <footer id="footer" className="bg-[#1A1A1A] text-gray-400 pt-12 pb-10 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        
        {/* Top Newsletter & Brand Banner */}
        <div className="bg-[#242424] rounded-2xl p-6 sm:p-10 mb-12 border border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Geometric subtle circle in newsletter box */}
          <div className="absolute w-48 h-48 border border-white/5 rounded-full -top-10 -right-10 pointer-events-none" />

          <div className="max-w-lg relative z-10">
            <span className="text-[10px] font-bold text-[#FF5A1F] uppercase tracking-widest">
              Join the Community
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Get 15% off your first purchase
            </h3>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              Subscribe for exclusive member deals, seasonal releases, and style notes.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full lg:max-w-md flex flex-col sm:flex-row gap-2 relative z-10">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-[#1A1A1A] border border-gray-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#FF5A1F] transition-colors"
                id="newsletter-email-input"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#FF5A1F] hover:bg-[#e64e16] text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
              id="newsletter-submit-btn"
            >
              {subscribed ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Subscribed!</span>
                </>
              ) : (
                <>
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          
          {/* Col 1: Brand Info */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-[#FF5A1F] rounded-full flex items-center justify-center text-white font-black text-xs">
                A
              </div>
              <span className="font-black text-sm text-white tracking-widest">
                AURA
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed mb-4">
              Modern essentials crafted for elevated everyday living. Built on balance, quality, and timeless design aesthetics.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Global Retailer • 100% Guaranteed</span>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Shop
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onSelectCategory('Fashion')} className="hover:text-[#FF5A1F] transition-colors text-left cursor-pointer">
                  Fashion & Apparel
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Electronics')} className="hover:text-[#FF5A1F] transition-colors text-left cursor-pointer">
                  Audio & Electronics
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Accessories')} className="hover:text-[#FF5A1F] transition-colors text-left cursor-pointer">
                  Handcrafted Bags
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Beauty')} className="hover:text-[#FF5A1F] transition-colors text-left cursor-pointer">
                  Skincare & Wellness
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('Home Decor')} className="hover:text-[#FF5A1F] transition-colors text-left cursor-pointer">
                  Home Decor & Living
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Order Tracking</a></li>
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Shipping Info</a></li>
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">30-Day Returns</a></li>
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Size Guide</a></li>
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Help Center</a></li>
            </ul>
          </div>

          {/* Col 4: About & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Our Story</a></li>
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Sustainability</a></li>
              {onOpenMongoDatabase && (
                <li>
                  <button 
                    onClick={onOpenMongoDatabase} 
                    className="text-[#00ED64] hover:underline font-semibold text-left cursor-pointer flex items-center gap-1"
                  >
                    <span>MongoDB Database</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">NoSQL</span>
                  </button>
                </li>
              )}
              {onOpenAzureStorage && (
                <li>
                  <button 
                    onClick={onOpenAzureStorage} 
                    className="text-[#0078D4] hover:underline font-semibold text-left cursor-pointer flex items-center gap-1"
                  >
                    <span>Azure Cloud Storage</span>
                    <span className="text-[9px] bg-blue-900/60 text-blue-200 px-1.5 py-0.2 rounded">Live API</span>
                  </button>
                </li>
              )}
              <li>
                <button 
                  onClick={onOpenAdminDashboard || onOpenAdminLogin || (() => {
                    const el = document.getElementById('admin-portal');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  })}
                  className="text-amber-400 hover:underline font-semibold text-left cursor-pointer flex items-center gap-1"
                  id="footer-admin-portal-link"
                >
                  <span>Admin Gateway</span>
                  <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800">subby@gmail.com</span>
                </button>
              </li>
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Careers</a></li>
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Privacy Policy</a></li>
              <li><a href="#hero" className="hover:text-[#FF5A1F] transition-colors">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Badges */}
        <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <p>© 2026 AURA Studio. All rights reserved.</p>
          <div className="flex items-center space-x-2">
            <span className="bg-[#242424] px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-gray-800">VISA</span>
            <span className="bg-[#242424] px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-gray-800">MASTERCARD</span>
            <span className="bg-[#242424] px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-gray-800">AMEX</span>
            <span className="bg-[#242424] px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-gray-800">APPLE PAY</span>
            <span className="bg-[#242424] px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-gray-800">PAYPAL</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
