import React from 'react';
import waveformBg from '@/assets/group-waveform.png';

const FeatureHeader = () => {
  return (
    <div className="w-full px-6 relative flex justify-center items-center" style={{ height: '106px' }}>
      {/* Background GIF with reduced opacity */}
      <img
        src={waveformBg?.src ?? waveformBg}
        alt="Waveform Background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.5 , zIndex: 0 }}
      />

      {/* Foreground content */}
      <div className="relative z-10 text-center text-white leading-tight">
        <h1 className="text-[35px] font-bold font-['Barlow'] mb-[1px]">
          Features That Power Voice-First Experiences
        </h1>
        <p className="text-[14px] max-w-[500px] mx-auto text-[#cccccc] font-['Barlow'] mt-[-2px]">
          Transform your brand with our innovative digital solutions that captivate and engage your audience.
        </p>
      </div>
    </div>
  );
};

export default FeatureHeader;
