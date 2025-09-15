import React from 'react';
import Link from 'next/link';
import introGif from '@/assets/homeIntroGif.gif';
import containerImage from '@/assets/Container.png';
import FeatureHeader from './Features/FeatureHeader';
import FeatureCards from './Features/FeatureCards';

const HomeIntroduction = () => {
  return (
    <div className="relative z-10 w-full px-1 flex flex-col items-center">
      {/* Full-screen Black Background with GIF */}
      <div className="absolute inset-0 -z-10 bg-black overflow-hidden">
        <img
          src={introGif?.src ?? introGif}
          alt="Background"
          className="w-screen h-[540px] object-cover blur-[2px]"
        />
      </div>

      {/* Centered Content on top of GIF */}
      <div className="relative z-10 w-full px-1 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center min-h-[320px] w-full">
          {/* Heading */}
          <h6 className="w-full max-w-[900px] font-['Barlow'] font-extrabold text-[50px] leading-[120%] text-white text-center pt-[20px] mb--30 mt-20">
            Build Smart Voice AI Agents in Minutes - No Complex Setup Needed
          </h6>

       <div
  style={{
    border: '1.5px solid #242424',
    background: '#1a1a1a80',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px',
    zIndex: 20,
    boxSizing: 'border-box',
    marginTop: '20px',
  }}
>
  <div className="flex justify-center items-center gap-3">
    <p className="text-white text-center font-['Barlow'] text-[16px] mt-[6px] mb-2">
      For
    </p>
    {['Startups', 'Enterprise leaders', 'Media & Publishers', 'Social Good'].map((item, i) => (
      <span key={i} className="inline-block rounded-[4px] bg-[#262626] px-3 py-1">
        <span className="text-[#00FFDD]">{item}</span>
      </span>
    ))}
  </div>
</div>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 mt-4 mb-12">
            <Link href="/login">
              <button
                className="min-w-[85px] h-[45px] rounded-[10px] bg-transparent text-white px-[28px] text-[16px] font-medium"
                style={{ border: '1.5px solid #242424' }}
              >
                Log In
              </button>
            </Link>

            <button className="w-[125px] h-[45px] rounded-[9.38px] bg-[#00FFDD] px-[20px] border-none">
              <span className="font-['Barlow'] font-medium text-[14px] leading-[150%] text-black">
                Talk to Sales
              </span>
            </button>
          </div>
        </div>

        {/* Container Image */}
        <div className="w-full py-[40px] mt-[-12px]">
          <img
            src={containerImage?.src ?? containerImage}
            alt="Container"
            className="w-full max-h-[120px] object-contain mx-auto"
          />
        </div>

        {/* Features Section */}
        <FeatureHeader />
        <FeatureCards />
      </div>
    </div>
  );
};

export default HomeIntroduction;