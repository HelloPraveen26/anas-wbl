import React, { useState } from 'react';

const faqs = [
  {
    number: '01',
    question: 'What is ZenVoice ?',
    answer:
      'ZenVoice is a powerful AI-powered voice API platform that enables you to build and integrate AI voice agents into your apps, websites, or workflows. It’s designed to help businesses automate voice interactions with natural, real-time communication.',
  },
  {
    number: '02',
    question: 'How does ZenVoice work',
    answer:
      'ZenVoice connects to LLMs (like GPT) via our API and handles real-time voice input and output. You send a request with voice input, and ZenVoice processes, interprets, and responds using natural language—just like a human agent would.',
  },
  {
    number: '03',
    question: 'Can I use ZenVoice in my own application or product?',
    answer:
      'Absolutely. ZenVoice provides a flexible API you can easily integrate into your app, website, or any workflow that requires conversational voice automation.',
  },
  {
    number: '04',
    question: 'What are some use cases for ZenVoice?',
    answer:
      'ZenVoice is ideal for customer support bots, voice assistants, appointment booking, sales calls, IVR systems, and voice-driven workflows across industries like e-commerce, healthcare, SaaS, and fintech.',
  },
  {
    number: '05',
    question: 'What languages does ZenVoice support?',
    answer:
      'Currently, ZenVoice supports English and other major global languages. We are constantly working to expand multilingual capabilities.',
  },
  {
    number: '06',
    question: 'Is real-time voice response supported?',
    answer:
      'Yes! ZenVoice supports low-latency, real-time streaming so conversations feel natural and immediate.',
  },
  {
    number: '07',
    question: 'How secure is ZenVoice?',
    answer:
      'We take data security seriously. ZenVoice uses encryption protocols and secure API practices to ensure your data is protected at all times.',
  },
  {
    number: '08',
    question: 'Can I customize the voice and tone of the AI agent?',
    answer:
      'Yes. You can customize voices, tones, personalities, and even the logic behind the conversation flow using your preferred LLM prompts.',
  },
];

const FAQSection = () => {
  const [openStates, setOpenStates] = useState({});

  const toggleFAQ = (index) => {
    setOpenStates((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <div style={{ backgroundColor: 'transparent', color: '#fff', padding: '10px 80px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', fontFamily: 'Barlow, sans-serif' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: '14px', color: '#ccc' }}>
          Still you have any questions? Contact our Team via{' '}
          <a href="mailto:hello@squareup.com" style={{ color: '#00FFDD', textDecoration: 'none' }}>
            ZenVoice
          </a>
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'transparent',
              padding: '20px',
              position: 'relative',
              border: '1px solid rgba(66, 230, 209, 0.4)',
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  marginRight: '15px',
                  fontSize: '14px',
                  fontWeight: '600',
                  minWidth: '35px',
                  textAlign: 'center',
                }}
              >
                {faq.number}
              </div>
              <div
                onClick={() => toggleFAQ(index)}
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flex: 1,
                  color: openStates[index] ? '#00FFDD' : '#fff',
                }}
              >
                {faq.question}
              </div>
              <div
                onClick={() => toggleFAQ(index)}
                style={{
                  cursor: 'pointer',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#ccc',
                  marginLeft: '10px',
                }}
              >
                {openStates[index] ? '×' : '+'}
              </div>
            </div>

            <div
              style={{
                maxHeight: openStates[index] ? '300px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease-in-out',
                marginTop: openStates[index] ? '12px' : '0',
                fontSize: '14px',
                color: '#ccc',
                lineHeight: '1.6',
              }}
            >
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
