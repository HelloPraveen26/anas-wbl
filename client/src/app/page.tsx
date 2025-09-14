'use client';

import HomeIntroduction from '@/components/home/HomeIntroduction';
import FAQSection from '@/components/home/FAQSection';
import ClientTestimonials from '@/components/home/ClientTestimonials';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';

export default function HomePage() {
  return (
    <div>
      <Header />
      <HomeIntroduction />
      <FAQSection />
      <div className="mt-5">
        <ClientTestimonials />
      </div>
      <Footer />
    </div>
  );
}


