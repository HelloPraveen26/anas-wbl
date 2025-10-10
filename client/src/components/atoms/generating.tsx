import { images } from "@/constants";
import { cn } from "@/lib/utils";
import { s } from "framer-motion/client";
import Image from "next/image";
import React from "react";

const Generating = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex h-14 items-center rounded-[1.7rem] bg-n-8/80 px-6 text-base whitespace-nowrap -mr-2",
        "text-xs sm:text-base", // Updated/Added: Smaller text on mobile (text-sm)
        className
      )}
    >
      Still have any questions? Contact our Team via
      <span className="text-green-500 font-medium ml-1">-ZenVoice</span> 
    </div>
  );
};

export default Generating;s