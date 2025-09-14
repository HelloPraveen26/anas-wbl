'use client';

import HomeIntroduction from '../components/HomeIntroduction';
import FAQSection from '../components/FAQSection'; // Adjust path if your file is elsewhere
import ClientTestimonials from '../components/ClientTestimonials';

function HomePage() {
  return (
    <div>
      <HomeIntroduction />
      <FAQSection />  
      <div className="mt-5">
  <ClientTestimonials />
</div>

      
      {/* Other page content */}
    </div>
  );
} 

export default HomePage;