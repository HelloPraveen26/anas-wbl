"use client";

import React from "react";
import Section from "@/components/layout/section";
import { collabApps, collabContent, collabText, images } from "@/constants";
import Image from "next/image";
import Button from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import { LeftCurve, RightCurve } from "@/components/design/collaboration";
import { motion } from "framer-motion";
import { Gradient } from "@/components/design/services";

type Props = {};

const Collaboration = (props: Props) => {
  const lines = ["What You Can Do", "with Zenvoice"];

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.2,
      },
    },
  };

  const child = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <Section id="collaboration" crosses>
      <div className="container lg:flex">
        {/* Left Section */}
        <div className="relative max-w-[25rem]">
          {/* Gradient Behind Heading */}
          <div className="absolute -top-24 -left-28 w-[420px] h-[420px] opacity-60 pointer-events-none blur-xl -mt-20">
            <Gradient />
          </div>

          {/* Animated Heading */}
          <motion.h2
            className="h2 mb-12 -mt-16 max-md:mb-4 text-green-300 relative z-10"
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            {lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {line.split("").map((char, charIndex) => (
                  <motion.span
                    key={`${lineIndex}-${charIndex}`}
                    variants={child}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
                {lineIndex < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </motion.h2>

          {/* Content List */}
          <ul className="mb-10 max-w-[22rem] md:mb-14">
            {collabContent.map((item) => (
              <li key={item.id} className="mb-3 py-3">
                <div className="flex items-center">
                  <Image
                    src={images.check}
                    width={24}
                    height={24}
                    alt="check"
                  />
                  <h6 className="body-2 ml-5">{item.title}</h6>
                </div>
                {item.text && (
                  <p className="body-2 mt-3 text-n-4">{item.text}</p>
                )}
              </li>
            ))}
          </ul>

          {/* Button */}
          <div className="w-full flex justify-end -mt-40 ml-80">
            <Button>Talk to sales</Button>
          </div>
        </div>

        {/* Right Section */}
        <div className="mt-4 lg:ml-auto xl:w-[38rem]">
          {/* This paragraph is now hidden by default ('hidden') and only
            shown on large screens and up ('lg:block').
          */}
          <p className="hidden body-2 mb-8 text-n-4 md:mb-16 lg:block lg:mx-auto lg:mb-32 lg:w-[22rem]">
            {collabText}
          </p>

          {/* Circular App Layout */}
          <div className="relative left-1/2 flex aspect-square w-[22rem] -translate-x-1/2 scale-75 rounded-full border border-n-6 md:scale-100 mt-15">
            <div className="m-auto flex aspect-square w-60 rounded-full border border-n-6">
              <div className="m-auto aspect-square w-24 rounded-full bg-conic-gradient p-[0.2rem]">
                <div className="flex h-full items-center justify-center rounded-full bg-n-8">
                  <Image
                    src={images.ZV}
                    width={58}
                    height={58}
                    alt="brainwave"
                  />
                </div>
              </div>
            </div>

            <ul>
              {collabApps.map((item, index) => {
                const total = collabApps.length;
                const angle = (360 / total) * index;
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "absolute left-1/2 top-0 -ml-[1.6rem] h-1/2 origin-bottom",
                    )}
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <div
                      className={cn(
                        "relative -top-[1.6rem] flex w-[3.2rem] h-[3.2rem] bg-n-7 border border-n-1/15 rounded-xl",
                      )}
                      style={{ transform: `rotate(-${angle}deg)` }}
                    >
                      <Image
                        src={item.icon}
                        alt={item.title}
                        width={36}
                        height={36}
                        className="m-auto"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <LeftCurve />
            <RightCurve />
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Collaboration;
