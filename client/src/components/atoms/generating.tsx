import { images } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

const Generating = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex h-14 items-center rounded-[1.7rem] bg-n-8/80 px-6 text-base whitespace-nowrap -mr-2",
        "text-xs sm:text-base",
        className,
      )}
    >
      <Image
        src={images.loading}
        className="w-5 h-5 mr-4"
        alt="Loading"
        width={20}
        height={20}
      />
      AI is generating
    </div>
  );
};

export default Generating;
