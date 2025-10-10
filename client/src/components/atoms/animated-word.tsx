// components/atoms/animated-word.tsx
"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

type Props = {
  text: string;
  delay?: number;
};

const AnimatedWord = ({ text, delay = 0 }: Props) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <span
      className={cn(
        "inline-block transform transition-transform duration-500 ease-in-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
    >
      {text}&nbsp;
    </span>
  );
};

export default AnimatedWord;