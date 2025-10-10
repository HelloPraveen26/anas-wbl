"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { navigation } from "@/constants";
import Button from "../atoms/button";

type Props = {};

const Navbar = (props: Props) => {
  const [hash, setHash] = useState<string>("hero");

  useEffect(() => {
    const dynamicNavbarHighlight = () => {
      const sections = document.querySelectorAll("section[id]");

      sections.forEach((current) => {
        if (current === null) return;

        const sectionId = current.getAttribute("id");
        // @ts-ignore
        const sectionHeight = current.offsetHeight;
        const sectionTop =
          current.getBoundingClientRect().top - sectionHeight * 0.2;

        if (
          sectionTop < 0 &&
          sectionTop + sectionHeight > 0 &&
          hash !== sectionId
        ) {
          setHash(`#${sectionId as string}`);
        }
      });
    };

    window.addEventListener("scroll", dynamicNavbarHighlight);

    return () => window.removeEventListener("scroll", dynamicNavbarHighlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cn(
        `fixed top-4 left-1/2 z-50 -translate-x-1/2
        rounded-full border border-gray-500 shadow-lg
        max-w-7xl w-[95%] px-8 py-3
        transition-colors duration-300
        bg-gradient-to-r from-[#0a0f1f]/80 to-[#0f1a2b]/80 backdrop-blur-sm`
      )}
    >
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Logo / Brand */}
        <h2 className="text-base sm:text-xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent whitespace-nowrap flex-shrink-0">
          Zenvoice
        </h2>

        {/* Navigation Links - Always visible, scrollable on mobile */}
        <nav className="flex-1 overflow-x-auto scrollbar-hide min-w-0">
          <div className="flex items-center justify-start lg:justify-center gap-0.5 sm:gap-1 lg:gap-4">
            {navigation.map((item) => (
              !item.onlyMobile && (
                <Link
                  key={item.id}
                  href={item.url}
                  className={cn(
                    `relative font-code uppercase transition-colors flex-shrink-0
                    px-1.5 sm:px-2 lg:px-3 py-6 text-[10px] sm:text-xs lg:text-base
                    font-medium tracking-wide whitespace-nowrap`,
                    item.url === hash
                      ? "text-green-400"
                      : "text-gray-300 hover:text-green-300 mr-5"
                  )}
                >
                  {item.title}
                  {item.url === hash && (
                    <span className="absolute left-1/2 -bottom-1 h-0.5 w-3 sm:w-4 lg:w-6 -translate-x-1/2 rounded-full bg-green-400"></span>
                  )}
                </Link>
              )
            ))}
          </div>
        </nav>

        {/* Action Buttons - Responsive */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 whitespace-nowrap flex-shrink-0">
          <Link
            href="/signup"
            className="hidden md:block text-gray-400 transition-colors hover:text-green-300 text-sm lg:text-base"
          >
            New account
          </Link>
          <Button
            href="/login"
            className="bg-gradient-to-r to-emerald-500 text-white font-semibold px-2 sm:px-3 lg:px-5 py-1 sm:py-1.5 lg:py-2 text-[10px] sm:text-xs lg:text-base rounded-full shadow-md hover:shadow-green-400/40 transition-shadow"
          >
            Sign in
          </Button>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Navbar;