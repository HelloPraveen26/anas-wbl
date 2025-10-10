"use client";

import React from "react";
import Section from "@/components/layout/section";
import Heading from "../../atoms/heading";
import { benefits } from "@/constants";
import Image from "next/image";
import Arrow from "@/components/svg/arrow";
import { GradientLight } from "@/components/design/benefits";
import ClipPath from "@/components/svg/clip-path";
import { motion } from "framer-motion";
import Link from "next/link";

type Props = {};

const Benefits = (props: Props) => {
  return (
    <Section id="features" className="relative">
      {/* Top gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-900/20 via-blue-900/6 to-transparent pointer-events-none z-0" />

      <div className="container relative z-2">
        <Heading
          className="md:max-w-md lg:max-w-2xl text-green-300"
          title="Features That Power Voice First Experiences"
          description="Transform your brand with innovative digital solutions that engage your audience."
        />
        <div className="mb-10 flex flex-wrap gap-10">
          {benefits.map((item, index) => (
            <motion.div
              key={item.id}
              className="relative block bg-[length:100%_100%] bg-no-repeat p-0.5 md:max-w-sm"
              style={{
                backgroundImage: `url(${item.backgroundUrl})`,
              }}
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              whileInView={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.8,
                  delay: index * 0.15,
                  ease: [0.25, 0.4, 0.25, 1],
                  opacity: { duration: 0.6 },
                  y: {
                    type: "spring",
                    stiffness: 60,
                    damping: 15,
                    mass: 1,
                  },
                  scale: { duration: 0.6 },
                },
              }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{
                y: -10,
                transition: {
                  duration: 0.3,
                  ease: "easeOut",
                },
              }}
            >
              {/* Card content */}
              <div className="pointer-events-none relative z-2 flex min-h-[22rem] flex-col p-[2.4rem]">
                <h5 className="h5 mb-5">{item.title}</h5>
                <p className="body-2 mb-6 text-n-3">{item.text}</p>

                {/* Old-style "Take to Sales" link */}
                <div className="mt-auto flex items-center">
                  <Link
                    href="https://moanalisha.fillout.com/11-with-monalisha"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto font-code text-xs font-bold uppercase tracking-wider text-n-1 -ml-25 pointer-events-auto flex items-center gap-1"
                  >
                    Take to Sales
                    <Arrow />
                  </Link>
                </div>
              </div>

              {item.light && <GradientLight />}

              <div
                className="absolute inset-0.5 bg-n-8"
                style={{ clipPath: `url(#benefits)` }}
              ></div>

              <ClipPath />
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Benefits;
