"use client";

import React from "react";
import Link from "next/link";
import { FaFacebookF, FaLinkedinIn, FaYoutube ,FaInstagram} from "react-icons/fa";
import Image from "next/image";

type Props = {};

const BACKGROUND_COLOR = "#09041A";
const ACCENT_COLOR = "#38BDF8";
const GREEN_ACCENT = "text-green-500";

const Footer = (props: Props) => {
 const contactInfo = {
  addressLine1: "3rd Floor, Lakshmi Bhavan, No. 609, Sundaram Ave, Anna Salai,",
  addressLine3: "Chennai – 600006",
  phone: "+91 90031 03018",
  email: "hello@zenxai.io",
};


  const quickLinks = [
    { name: "Terms & Condition", href: "https://zenxai.io/terms" },
    { name: "Support", href: "https://zenxai.io/privacy" },
    { name: "Refund Policy", href: "https://zenxai.io/refund" },
  ];

  // ✅ Updated with your actual assets
  const certifications = [
    { src: "/assets/gdpr.svg", alt: "GDPR Certified" },
    { src: "/assets/soc-type-ll.png", alt: "SOC Type II Certified" },
  ];

  const socialLinks = [
    { icon: FaInstagram, href:"https://www.instagram.com/harivikashhh?igsh=ZXZ6MXF2Nmt2anQ1"},
    { icon: FaFacebookF, href: " https://www.facebook.com/share/1CXv9zsABN/?mibextid=wwXIfr" },
    { icon: FaYoutube, href: "https://youtube.com/@harivikashhh?si=OJfJU_lJUWSZZxxt" },
    { icon: FaLinkedinIn, href: " https://www.linkedin.com/in/harivikash?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" },
  ];

  return (
    <footer
      className={`bg-[${BACKGROUND_COLOR}] text-white pt-16 pb-6 font-sans border-t border-gray-800`}
    >
      <div className="w-full px-10 sm:px-16 lg:px-24">
        {/* Changed grid-cols-2 to grid-cols-2 for mobile and md:grid-cols-4 for desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16"> 
          
          {/* Column 1: Our Office & Contact Us */}
          <div>
            <h4
              className={`text-xl font-bold mb-6 ${GREEN_ACCENT} uppercase tracking-wider`}
            >
              Our Office
            </h4>
            <div className="text-base space-y-4 mb-8"> {/* Added mb-8 for separation */}
              <p className="flex flex-col text-gray-300">
                <span className="mb-1">{contactInfo.addressLine1}</span>
                {/* Check if addressLine2 exists before rendering */}
                {contactInfo.addressLine2 && <span className="mb-1">{contactInfo.addressLine2}</span>}
                <span>{contactInfo.addressLine3}</span>
              </p>
            </div>
            
            {/* Added new "Contact Us" heading here */}
            <h4
              className={`text-xl font-bold mb-6 ${GREEN_ACCENT} uppercase tracking-wider`}
            >
              Contact Us
            </h4>
            
            <div className="text-base space-y-4">
                <p className="flex items-center space-x-3">
                    <span className={`${GREEN_ACCENT} text-lg`}>📞</span>
                    <span className="text-white hover:text-gray-300 transition duration-200">
                    {contactInfo.phone}
                    </span>
                </p>
                <p className="flex items-center space-x-3">
                    <span className={`${GREEN_ACCENT} text-lg`}>📧</span>
                    <a
                    href={`mailto:${contactInfo.email}`}
                    className={`text-white hover:text-[${ACCENT_COLOR}] transition duration-200`}
                    >
                    {contactInfo.email}
                    </a>
                </p>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4 pt-8"> {/* Increased pt for separation */}
              {socialLinks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 bg-[${ACCENT_COLOR}] text-[${BACKGROUND_COLOR}] rounded-full hover:opacity-80 transition duration-300`}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Quick Links (No changes here, maintaining structure) */}
          <div>
            <h4
              className={`text-xl font-bold mb-6 ${GREEN_ACCENT} uppercase tracking-wider`}
            >
              Quick Links
            </h4>
            <ul className="text-base space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`flex items-center text-gray-400 hover:text-[${ACCENT_COLOR}] transition duration-200`}
                  >
                    <span
                      className={`mr-3 text-lg font-bold ${GREEN_ACCENT} transition duration-200`}
                    >
                      &gt;
                    </span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Certifications (Used col-span-2 on mobile, col-span-1 on md+) */}
          <div className="col-span-2 md:col-span-1">
            <h4
              className={`text-xl font-bold mb-6 ${GREEN_ACCENT} uppercase tracking-wider`}
            >
              Certifications
            </h4>
            <div className="flex space-x-8 pt-2 items-center">
              {certifications.map((cert, index) => (
                <div key={index} className="w-24 md:w-32 h-auto">
                  <Image
                    src={cert.src}
                    alt={cert.alt}
                    width={128}
                    height={64}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr className="my-12 border-gray-700" />

        <div className="flex flex-col md:flex-row justify-between items-center text-base text-gray-400 pb-2">
          <div className="text-center md:text-left mb-3 md:mb-0">
            © Hexite Technologies Private Limited. All Rights Reserved.
          </div>

          <div className="flex items-center space-x-4">
            <span
              className={`text-[${ACCENT_COLOR}] font-semibold text-lg`}
            >
              Zenxai Presents ZenVoice
            </span>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={`w-10 h-10 flex items-center justify-center bg-[${ACCENT_COLOR}] text-[${BACKGROUND_COLOR}] rounded transition-transform hover:scale-110`}
              aria-label="Scroll to top"
            >
              <span className="font-bold text-2xl leading-none">↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;