import React, { useState } from 'react';

import voiceIcon from '@/assets/Icons/voice.png';
import ApiIcon from '@/assets/Icons/Api.png';
import ScalableIcon from '@/assets/Icons/Scalable.png';
import CallIcon from '@/assets/Icons/Call.png';
import PuzzleIcon from '@/assets/Icons/Puzzle.png';
import DashboardIcon from '@/assets/Icons/Dashboard.png';

import CustomerIcon from '@/assets/Icons/Customer.png';
import OutBoundIcon from '@/assets/Icons/OutBound.png';
import AppoinSchIcon from '@/assets/Icons/AppoinSch.png';
import VoiceSurveyIcon from '@/assets/Icons/VoiceSurvey.png';
import orderIcon from '@/assets/Icons/order.png';
import RemainderIcon from '@/assets/Icons/Remainder.png';

import FlexBg from '@/assets/Icons/FlexBg.png';
import LaunchFlex from '@/assets/Icons/LaunchFlex.png';
import dotedBg from '@/assets/dotedBg.png';

const features = [
  { icon: voiceIcon, title: 'Real-Time Voice Conversations', description: 'Deliver seamless, human-like voice interactions powered by cutting-edge AI. Your voice agents are always ready — 24/7 — to engage customers with natural flow and clarity.' },
  { icon: ApiIcon, title: 'Instant API Integration', description: 'Integrate in minutes, not days. Our streamlined API connects effortlessly with your existing tools, apps, or CRMs. Drag & drop UI to deploy your voice AI in minutes.' },
  { icon: ScalableIcon, title: 'Customizable & Scalable', description: 'From basic queries to complex workflows, build AI agents that fit your exact needs. Whether it\'s for sales, support, surveys, or bookings — scale as you grow.' },
  { icon: CallIcon, title: 'Outbound & Inbound Call Support', description: 'Automate both outgoing and incoming calls—perfect for reminders, lead follow-ups, and support.' },
  { icon: PuzzleIcon, title: 'Live Dashboard & Analytics', description: 'Feed your voice agents with custom documents, FAQs, or APIs so they can respond with accurate, business-specific answers.' },
  { icon: DashboardIcon, title: 'Custom Knowledge Integration', description: 'Track call performance, conversation quality, and agent responses in real-time with a clean, powerful dashboard.' },
];

const useCases = [
  { icon: CustomerIcon, title: 'Customer Support Automation', description: 'Resolve queries instantly, 24/7. Voice AI agents handle routine support calls with natural conversations, reducing wait times and freeing up human agents for complex issues.' },
  { icon: OutBoundIcon, title: 'Outbound Call Campaigns', description: 'Reach thousands, automatically. Launch personalized, large-scale outbound call campaigns for promotions, follow-ups, feedback, and more — all without lifting the phone.' },
  { icon: AppoinSchIcon, title: 'Appointment Scheduling', description: 'Book and manage appointments via voice. Let users schedule, reschedule, or cancel appointments in real-time through a friendly, conversational voice interface.' },
  { icon: VoiceSurveyIcon, title: 'Voice Surveys & Feedback', description: 'Collect insights through natural dialogue. Deploy interactive voice surveys that feel human. Gather actionable feedback, CSAT scores, and customer opinions with ease.' },
  { icon: orderIcon, title: 'Order Updates & Tracking', description: 'Keep customers informed — automatically. Send real-time voice updates about order status, delivery confirmations, and more — triggered by your systems via simple APIs.' },
  { icon: RemainderIcon, title: 'Health Reminders & Confirmations', description: 'Automate patient communication. Voice agents can remind patients about upcoming appointments, medication schedules, or wellness checks — reducing no-shows and improving care.' },
];

const pricingOptions = [
  {
    title: 'Automation trigger.',
    description: 'Select quantity',
    ratePerUnit: 1.6,
    quantityOptions: [1000, 2000, 3000, 4000],
    currency: '₹',
    isFixed: false
  },
  {
    title: 'AI support agent responses',
    description: 'Select quantity',
    ratePerUnit: 2.5,
    quantityOptions: [1000, 2000, 3000, 4000],
    currency: '₹',
    isFixed: false
  },
  {
    title: 'Integrations',
    description: '',
    price: '$4.99/Month',
    isFixed: true
  },
];

const FeatureCard = ({ feature }) => (
  <div
    style={{
      backgroundColor: 'transparent',
      borderRadius: '10px',
      border: '1px solid rgba(66, 230, 208, 0.56)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      minHeight: '350px',
    }}
  >
    <div>
      <img
        src={feature.icon?.src ?? feature.icon}
        alt="Icon"
        width="50"
        height="45"
        style={{ marginBottom: '12px' }}
      />
      <h3 style={{
        fontSize: '20px',
        fontWeight: '710',
        color: '#fff',
        marginBottom: '16px',
        fontFamily: 'Barlow, sans-serif'
      }}>
        {feature.title}
      </h3>
      <p style={{
        fontSize: '14px',
        lineHeight: '1.9',
        color: '#ccc',
        fontFamily: 'Barlow, sans-serif'
      }}>
        {feature.description}
      </p>
    </div>
    
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      <button
        style={{
          width: '90%',
          height: '40px',
          background: 'transparent',
          color: '#fff',
          border: '1px solid rgba(66, 230, 208, 0.54)',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '13px',
          fontFamily: 'Barlow, sans-serif',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = '#42E6D1';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          e.target.style.color = 'black';
          e.target.style.borderColor = '#42E6D1';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
          e.target.style.color = '#fff';
          e.target.style.borderColor = 'rgba(66, 230, 208, 0.39)';
        }}
      >
        Talk to Sales
      </button>
    </div>
  </div>
);

const FeatureCards = () => {
  const [selectedQuantities, setSelectedQuantities] = useState({
    0: 1000,
    1: 1000,
  });

  const handleQuantityChange = (optionIndex, newQuantity) => {
    setSelectedQuantities(prev => ({
      ...prev,
      [optionIndex]: parseInt(newQuantity)
    }));
  };

  const calculatePrice = (option, optionIndex) => {
    if (option.isFixed) {
      return option.price;
    }
    
    const quantity = selectedQuantities[optionIndex] || option.quantityOptions[0];
    const totalPrice = (option.ratePerUnit * quantity).toFixed(0);
    return `${option.currency}${totalPrice}/Month`;
  };

  return (
    <div
      style={{
        backgroundColor: 'transparent',
        color: '#fff',
        padding: '40px 20px 60px',
        backgroundImage: `url(${dotedBg.src ?? dotedBg})`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Features Section */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '24px', 
          marginBottom: '60px'
        }}>
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>

        {/* Pricing Section */}
        {/* <div style={{
          backgroundColor: 'transparent',
          borderRadius: '16px',
          padding: '40px',
          margin: '60px 0',
          border: '1px solid rgba(66, 230, 208, 0.39)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            fontFamily: 'Barlow, sans-serif',
            color: '#fff',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Scale your workflow with custom-made plugins.
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px', 
            justifyContent: 'center'
          }}>
            {pricingOptions.map((option, index) => (
              <div key={index} style={{
                backgroundColor: 'transparent',
                borderRadius: '10px',
                padding: '30px 20px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                border: '1px solid rgba(66, 230, 208, 0.39)'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#fff',
                  marginBottom: '10px'
                }}>
                  {option.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#ccc',
                  marginBottom: '20px'
                }}>
                  {option.description}
                </p>
                {!option.isFixed ? (
                  <div style={{
                    position: 'relative',
                    width: '120px',
                    marginBottom: '10px'
                  }}>
                    <select
                      value={selectedQuantities[index] || option.quantityOptions[0]}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      style={{
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        backgroundColor: 'transparent',
                        backgroundImage: 'none',
                        border: '1px solid rgba(66, 230, 208, 0.39)',
                        borderRadius: '5px',
                        color: 'white',
                        padding: '8px 30px 8px 12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      {option.quantityOptions.map((qty) => (
                        <option key={qty} value={qty} style={{ backgroundColor: '#000', color: '#fff' }}>
                          {qty}
                        </option>
                      ))}
                    </select>
                    <span style={{
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      right: '12px',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid #fff',
                    }}></span>
                  </div>
                ) : null}
                <h4 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#fff',
                  marginTop: '20px'
                }}>
                  {calculatePrice(option, index)}
                </h4>
              </div>
            ))}
          </div>
        </div> */}

        {/* Use Cases Header */}
        <div style={{
          position: 'relative',
          backgroundImage: `url(${FlexBg.src})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          padding: '41px 20px',
          color: '#fff',
          textAlign: 'center',
          overflow: 'hidden',
          backgroundColor: 'rgba(5, 11, 5, 0)',
          borderRadius: '12px',
          border: '1px solid rgba(66, 230, 208, 0.39)',
          marginBottom: '40px'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#000', opacity: 0.8, zIndex: 1 }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{ fontSize: '35px', fontWeight: '700', fontFamily: 'Barlow, sans-serif' }}>
              What You Can Do with Zenx Voice AI
            </h1>
            <p style={{ maxWidth: '800px', margin: '2px auto 0', fontSize: '15px', lineHeight: '1.5', fontFamily: 'Barlow, sans-serif', color: '#ccc' }}>
              Discover how Zenx Voice AI can streamline communication, automate calls, and deliver human-like voice interactions across support, sales, healthcare, logistics, and more — all with zero manual effort.
            </p>
          </div>
        </div>

        {/* Use Cases Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '24px', 
          marginBottom: '60px'
        }}>
          {useCases.map((item, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'transparent',
                height: '100%',
                border: '1px solid rgba(66, 230, 208, 0.39)',
                borderRadius: '10px',
                padding: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', marginBottom: '12px' }}>
                <img
                  src={item.icon?.src ?? item.icon}
                  alt={`${item.title} Icon`}
                  width={50}
                  height={50}
                  style={{ marginRight: '12px' }}
                />
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  lineHeight: '1.4',
                  color: '#fff',
                  fontFamily: 'Barlow, sans-serif',
                  margin: 0
                }}>
                  {item.title}
                </h3>
              </div>
              <p style={{ 
                fontSize: '14px', 
                lineHeight: '1.6', 
                marginTop: '6px', 
                color: '#ccc',
                fontFamily: 'Barlow, sans-serif',
                margin: 0
              }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Launch CTA */}
        <div style={{
          position: 'relative',
          backgroundImage: `url(${LaunchFlex.src})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          padding: '60px 20px',
          color: '#ccc',
          textAlign: 'center',
          borderRadius: '12px',
          border: '1px solid rgba(66, 230, 209, 0.4)',
          backgroundColor: '#0a0a0a'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '0%', height: '0%', backgroundColor: '#000', opacity: 0.8, zIndex: 1 }} />
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'Barlow, sans-serif', marginBottom: '15px' }}>
              Ready to Launch Your First Voice Agent?
            </h1>
            <p style={{ fontSize: '15px', lineHeight: '1.6', fontFamily: 'Barlow, sans-serif', marginBottom: '30px', color: '#ccc' }}>
              Start building smarter, more human voice experiences with Zenx Voice AI. No complex setup. No coding stress. Just powerful voice automation — ready in minutes.
            </p>
            <button
              style={{
                color: 'white',
                backgroundColor: '#42E6D1',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#42E6D1';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.color = 'black';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#242424';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
                e.target.style.color = 'white';
              }}
            >
              Talk to Sales
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: repeat(3, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: repeat(3, 1fr)"],
          div[style*="gridTemplateColumns: repeat(2, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FeatureCards;
