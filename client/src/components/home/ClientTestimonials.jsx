import React from 'react';

const testimonials = [
  {
    title: 'Zenvioce has been Instrumental in Transforming our Online Presence.',
    content: `Their team's expertise in web development and design resulted in a visually stunning and user-friendly e-commerce platform.`,
    name: 'Zein Fashion',
  },
  {
    title: 'Working with Zenvioce was a breeze.',
    content: `They understood our vision for a mobile app. The app they delivered exceeded expectations.`,
    name: 'Zaktron',
  },
  {
    title: 'Zenvioce created a booking system for our events.',
    content: `Their detail-oriented approach helped us streamline everything.`,
    name: 'Producer Bazaar',
  },
  {
    title: 'They automated our operations — game changer.',
    content: `Zenvioce boosted our productivity and reduced errors.`,
    name: 'Izzat Councils',
  },
  {
    title: 'Fewer No-Shows, More Revenue.',
    content: `Appointment reminders from Zenxvoice drastically reduced no-shows. It keeps our schedule full without manual follows-ups.`,
    name: 'Health Care',
  },
  {
    title: 'Smarter Customer Support.',
    content: `Our voice AI now answer 80% of customer queries automatically. It saves our team hours every single day`,
    name: 'Tele Calling',
  },
];

const ClientTestimonials = () => {
  return (
    <section className="bg-black text-white py-16 -mt-10 ">
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5sm font-bold mb-6">
          What our Clients say About us
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed px-4">
          At SquareUp, we take pride in delivering exceptional digital products and services.
          Here's what our satisfied clients say.
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2">
          {testimonials.map((item, index) => {
            // Determine position in 3x2 grid
            const col = index % 3; // 0, 1, 2
            const row = Math.floor(index / 3); // 0 or 1
            
            // Border logic for 3x2 grid
            const hasRightBorder = col < 2; // First two columns have right border
            const hasBottomBorder = row < 1; // First row has bottom border

            return (
              <div
                key={index}
                className={`
                  p-8 min-h-[280px] flex flex-col justify-between
                  ${hasRightBorder ? 'border-r border-gray-600' : ''}
                  ${hasBottomBorder ? 'border-b border-gray-600' : ''}
                `}
                style={{ backgroundColor: '#000000' }}
              >
                {/* Content */}
                <div className="flex-1">
                  <h3 
                    className="text-lg font-bold mb-3 leading-tight"
                    style={{ color: '#00ffddd8' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    {item.content}
                  </p>
                </div>

                {/* Client Info */}
                <div 
                  className="rounded-lg p-3 mt-auto"
                  style={{ backgroundColor: '#111111' }}
                >
                  <div className="text-white font-semibold text-sm">
                    {item.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ClientTestimonials;