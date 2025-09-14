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
    content: `Appoinment reminders from Zenxvoice drastically reduced no-shows.
    it keeps our schedule full without manaul follows-ups.`,
    name: 'Health Care',
  
    
  },
  {
    title: 'Smarter Customer Support.',
    content: `Our voice Ai now answer 80% of customer queries automatically.
    it saves our team hours every single day`,
    name: 'Tele Calling ',
   
  
  },
];

const ClientTestimonials = () => {
  return (
    <section className="bg-black text-white py-5 mt-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold display-6">What our Clients say About us</h2>
        <p className="text-white mx-auto" style={{ maxWidth: '600px' ,color: '#ccc',}}>
          At SquareUp, we take pride in delivering exceptional digital products and services.
          Here's what our satisfied clients say.
        </p>
      </div>

      <div className="container">
        <div className="row g-0">
          {testimonials.map((item, index) => {
            const isEndOfRow = (index + 1) % 3 === 0;
            const isLastRow = index >= testimonials.length - 3;

            const borderStyle = {
              borderRight: !isEndOfRow ? '1px solid rgba(136, 136, 136, 0.55)' : 'none',
              borderBottom: !isLastRow ? '1px solid rgba(136, 136, 136, 0.45)' : 'none',
            };

            return (
              <div className="col-md-4 d-flex" key={index} style={borderStyle}>
                <div
                  className="p-4 d-flex flex-column justify-between w-100"
                  style={{
                    backgroundColor: 'black',
                    minHeight: '100%',
                  }}
                >
                  <div>
                    <h5
                      style={{
                        fontSize: '18 px',
                        fontWeight: '700',
                        color: '#42E6D1', 
                        marginBottom: '10px',
                        lineHeight: '1.4',
                        fontFamily: 'Barlow, sans-serif',
                      }}
                    >
                      {item.title}
                    </h5>
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#ccc',
                        lineHeight: '1.6',
                        fontFamily: 'Barlow, sans-serif',
                      }}
                    >
                      {item.content}
                    </p>
                  </div>
                  <div
                    className="d-flex align-items-center mt-4 p-3 rounded"
                    style={{ backgroundColor: '#111' }}
                  >
                      
                    <div className="ms-3">
                      <div className="fw-bold text-white">{item.name}</div>
                      <div className="text-white small">{item.role}</div>
                    </div>
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
