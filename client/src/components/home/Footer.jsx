import React from 'react';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaEnvelope } from 'react-icons/fa';
import logo1 from '@/assets/logo1.png';
import logo2 from '@/assets/logo2.png';

const Footer = () => {
  return (
    <div className="bg-black text-white">
      <footer className="py-3 px-4 pb-6">
        <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
          {/* Logos */}
          <div className="flex items-center gap-2">
            <img src={logo1?.src ?? logo1} alt="Logo 1" className="h-[27px] w-auto object-contain" />
            <img src={logo2?.src ?? logo2} alt="Logo 2" className="h-[20px] w-auto object-contain" />
          </div>

          {/* Email & Copyright */}
          <div className="flex items-center flex-wrap gap-2 text-sm">
            <div className="flex items-center gap-2">
              <FaEnvelope color="#00FFDD" />
              <span>hello@zenx.io</span>
            </div>
            <span className="mx-3 text-[#444]">|</span>
            <div>© 2025 Zenxvoice. All rights reserved</div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            <span className="text-white">Stay Connected</span>
            <a href="#" className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <FaFacebookF color="#00FFDD" size={14} />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <FaTwitter color="#00FFDD" size={14} />
            </a>
            <a href="https://www.linkedin.com/company/zenxai/posts/?feedView=all" className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
              <FaLinkedinIn color="#00FFDD" size={14} />
            </a>
          </div>
        </div>
      </footer>

      {/* Bottom spacing that WILL work */}
      <div className="w-full h-8 sm:h-12 bg-black"></div>
    </div>
  );
};

export default Footer;
