import { companyLogos } from "@/constants";
import React from "react";
import Image from "next/image";

const CompanyLogos = ({ className }: { className: string }) => {
  return (
    <div className={className}>
      {/* The class 'text-lg' applies to mobile by default.
        The class 'md:text-xl' overrides it on medium screens and up.
      */}
      <h5 className="tagline mb-6 text-center text-n-1/90 text-sm md:text-xl">
        Helping Businesses Connect with People Through AI Agents
      </h5>
      <div className="relative overflow-hidden">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-Blue to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-Blue to-transparent pointer-events-none" />

        {/* Scrolling container */}
        <div className="flex animate-scroll">
          {/* First set of logos */}
          <ul className="flex shrink-0">
            {companyLogos.map((logo, index) => (
              <li
                key={index}
                className="flex h-[8.5rem] w-[200px] flex-shrink-0 items-center justify-center px-8"
              >
                {typeof logo === "string" ? (
                  <Image
                    src={logo}
                    width={134}
                    height={28}
                    alt={`Company logo ${index + 1}`}
                  />
                ) : (
                  <span className="text-xl font-bold text-n-1/70 uppercase tracking-wider">
                    {logo.text}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Duplicate set for seamless loop */}
          <ul className="flex shrink-0">
            {companyLogos.map((logo, index) => (
              <li
                key={`duplicate-${index}`}
                className="flex h-[8.5rem] w-[200px] flex-shrink-0 items-center justify-center px-8"
              >
                {typeof logo === "string" ? (
                  <Image
                    src={logo}
                    width={134}
                    height={28}
                    alt={`Company logo ${index + 1}`}
                  />
                ) : (
                  <span className="text-xl font-bold text-n-1/70 uppercase tracking-wider">
                    {logo.text}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 10s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default CompanyLogos;