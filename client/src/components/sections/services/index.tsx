"use client";

import React, { useState, useEffect, useRef } from "react";
// NOTE: Ensure this path is correct in your project structure:
import Section from "@/components/layout/section";
import Heading from "../../atoms/heading";
import { cn } from "@/lib/utils";
import { Gradient } from "@/components/design/services";
import Generating from "../../atoms/generating";

interface PricingOption {
  title: string;

  rateTiers?: { min: number; max: number; rate: number }[];
  quantityOptions?: number[];
  currency?: string;
  price?: string;
  isFixed: boolean;
  unit?: string;
  conversionRate?: number; // For converting other units to minutes
  description?: string; // Added description field for Service Information
}

interface SelectedQuantities {
  [key: number]: number;
}

const pricingOptions: PricingOption[] = [
  {
    title: "Conversational AI",

    rateTiers: [
      { min: 0, max: 1000, rate: 4.35 },
      { min: 1000, max: 10000, rate: 4.25 }, // FIX: Adjusted min to 1001
      { min: 10000, max: 100000, rate: 4.0 }, // FIX: Adjusted min to 10001
      { min: 100000, max: 1000000, rate: 3.85 }, // FIX: Adjusted min to 100001
    ],
    quantityOptions: [1000, 10000, 100000, 1000000],
    currency: "₹",
    unit: "minutes",
    isFixed: false,
    conversionRate: 1, // 1 minute = 1 minute
  },
  {
    title: "Workflow Integration",

    rateTiers: [
      { min: 0, max: 12000, rate: 0 },
      { min: 12000, max: 120000, rate: 0 },
      { min: 120000, max: 1000000, rate: 0.01 },
    ],
    quantityOptions: [12000, 120000, 1000000],
    currency: "₹",
    unit: "triggers",
    isFixed: false,
    // Set to 1.0. This makes the per-minute contribution 0.01 * 1 = 0.01
    conversionRate: 1.0,
  },
  {
    title: "Service Information",
    description:
      "Telephonic Services Cost estimates are provided based on original project specifications and requirements.\n\nVoice Modulation: Pricing is variable and depends on the selected voice profile, tone, and modulation preferences.",
    isFixed: true,
    // If you'd like a displayed price for Service Information, you can set `price` here (e.g. "₹4,999")
  },
];

// Calculate rate based on tier
const getRateForQuantity = (
  option: PricingOption,
  quantity: number,
): number => {
  if (!option.rateTiers) return 0;

  for (const tier of option.rateTiers) {
    if (quantity >= tier.min && quantity <= tier.max) {
      return tier.rate;
    }
  }

  // If quantity exceeds all tiers, use the last tier rate
  return option.rateTiers[option.rateTiers.length - 1].rate;
};

// Calculate price for individual option. Displays per-unit rate.
const calculatePrice = (
  option: PricingOption,
  selectedQuantity: number,
  optionIndex: number,
): string => {
  if (option.isFixed) return option.price || "";

  const quantity = selectedQuantity || (option.quantityOptions?.[0] ?? 0);
  const rate = getRateForQuantity(option, quantity);

  // For Workflow Integration (index 1), display the price per trigger
  if (optionIndex === 1) {
    return `${option.currency}${rate.toFixed(2)}/${option.unit?.slice(0, -1)}`;
  }

  // For other services (Conversational AI), convert to per-minute rate for display
  const perMinuteRate = rate * (option.conversionRate || 1);

  return `${option.currency}${perMinuteRate.toFixed(2)}/minute`;
};

// Calculate total per-minute cost (uses conversionRate for accurate summation)
const getTotalPerMinuteCost = (
  selectedQuantities: SelectedQuantities,
): string => {
  let totalPerMinute = 0;

  pricingOptions.forEach((option, index) => {
    if (option.isFixed) {
      totalPerMinute += option.conversionRate || 0;
    } else {
      const quantity =
        selectedQuantities[index] || (option.quantityOptions?.[0] ?? 0);
      const rate = getRateForQuantity(option, quantity);

      // Calculate the per-minute rate using the conversionRate
      const perMinuteRate = rate * (option.conversionRate || 1);
      totalPerMinute += perMinuteRate;
    }
  });

  return `₹${totalPerMinute.toFixed(2)}`;
};

// Get rate display text for an option
const getRateDisplay = (
  option: PricingOption,
  selectedQuantity: number,
): string => {
  if (option.isFixed) return "(Platform base cost)";

  const quantity = selectedQuantity || (option.quantityOptions?.[0] ?? 0);
  const rate = getRateForQuantity(option, quantity);

  const currentTier = option.rateTiers?.find(
    (tier) => quantity >= tier.min && quantity <= tier.max,
  );

  return `(Cost per ${option.unit?.slice(0, -1)})`;
};

// CALCULATE: The total estimated cost for a single option based on the selected quantity
const calculateTotalEstimatedCostPerOption = (
  option: PricingOption,
  selectedQuantity: number,
): number => {
  if (option.isFixed) return 0; // Fixed options don't contribute to this total

  const quantity = selectedQuantity || (option.quantityOptions?.[0] ?? 0);
  const rate = getRateForQuantity(option, quantity);

  // Cost = Quantity * Rate
  return rate * quantity;
};

// CALCULATE: The TOTAL estimated cost for all options combined
const getTotalEstimatedCost = (
  selectedQuantities: SelectedQuantities,
): number => {
  let totalCost = 0;

  pricingOptions.forEach((option, index) => {
    totalCost += calculateTotalEstimatedCostPerOption(
      option,
      selectedQuantities[index],
    );
  });

  return totalCost;
};

// Helper to format the total cost with currency and locale
const formatTotalCost = (total: number, currency: string = "₹") => {
  // Use 'en-IN' for Indian Rupee formatting with commas and no decimals
  return `${currency}${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

const PricingCalculator = () => {
  const [selectedQuantities, setSelectedQuantities] =
    useState<SelectedQuantities>({
      // Initialized to 10,000 to match the tier structure.
      0: 10000,
      1: 1000000,
      // index 2 is Service Information (fixed)
    });
  const [animatePrice, setAnimatePrice] = useState<boolean>(false);

  const handleQuantityChange = (optionIndex: number, newQuantity: string) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [optionIndex]: parseInt(newQuantity),
    }));
    setAnimatePrice(true);
    setTimeout(() => setAnimatePrice(false), 300);
  };

  return (
    <div className="flex h-full flex-col">
      {/* FIX: Added max-w-full to prevent overflow beyond parent container */}
      <section
        id="price"
        className="flex h-full flex-col scroll-mt-24 max-w-full"
      >
        {/* Header */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-blue-500">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="h5 font-bold text-white-400">
              {" "}
              Estimate Your Fueling Cost
            </h3>
          </div>
          <p className="body-2 text-gray-400">
            All costs based on selected minutes/triggers. Adjust usage to see
            your total estimated cost.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {pricingOptions.map((option, index) => {
            const currentQuantity =
              selectedQuantities[index] || (option.quantityOptions?.[0] ?? 0);
            const estimatedCost = calculateTotalEstimatedCostPerOption(
              option,
              currentQuantity,
            );

            return (
              <div
                key={index}
                className="group rounded-xl border border-white/40 bg-n-7/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/70"
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Title and Description Container (takes full width on mobile) */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400"></div>
                      <h4 className="font-semibold text-white break-words">
                        {option.title}
                      </h4>
                    </div>
                    {option.description && (
                      <p className="ml-3.5 text-xs text-gray-400 whitespace-pre-line">
                        {option.description}
                      </p>
                    )}
                  </div>

                  {/* Dropdown Container (stacks below title on mobile, goes to right on sm+) */}
                  {!option.isFixed && (
                    <div className="w-full sm:w-auto mt-2 sm:mt-0">
                      <select
                        value={currentQuantity}
                        onChange={(e) =>
                          handleQuantityChange(index, e.target.value)
                        }
                        // Adjusted classes for better mobile responsiveness
                        className="w-full cursor-pointer rounded-lg border border-white/10 bg-n-7 px-3 py-2 text-sm text-white transition-all hover:border-white/50 focus:border-white/70 focus:outline-none focus:ring-2 focus:ring-green-400/20 sm:w-auto"
                      >
                        {option.quantityOptions?.map((qty) => (
                          <option key={qty} value={qty}>
                            {qty.toLocaleString()} {option.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Price and Estimated Cost Display (Mobile-friendly flex-wrap) */}
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 ml-3.5 mt-2">
                  {/* Per-Unit Rate Display */}
                  <div className="flex items-baseline gap-1 mb-2 sm:mb-0">
                    <span className="h5 font-bold text-green-300">
                      {calculatePrice(option, currentQuantity, index)}
                    </span>
                    {!option.isFixed && (
                      <span className="text-xs text-gray-400">
                        {getRateDisplay(option, currentQuantity)}
                      </span>
                    )}
                  </div>

                  {/* Total Estimated Cost Display */}
                  {!option.isFixed && (
                    <div className="flex flex-wrap items-baseline gap-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400 mr-2 whitespace-nowrap">
                        Estimated Cost:
                      </span>
                      <span className="h5 font-bold text-white whitespace-nowrap">
                        {formatTotalCost(estimatedCost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary Card */}
        <div className="mt-4 rounded-xl border border-white/40 bg-n-7/50 p-4 backdrop-blur-sm shadow-lg">
          {/* FIX: Ensure flex container wraps on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              {/* FIX: Use block/inline to force wrap the label and the cost on small screens */}
              <p
                className={`text-xl sm:text-2xl font-bold text-white transition-all duration-300 ${animatePrice ? "scale-105 sm:scale-110" : ""} max-w-full`}
              >
                <span className="text-base font-semibold text-gray-300 sm:text-xl block sm:inline">
                  Total Estimated Cost :
                </span>
                <span className="block mt-1 sm:mt-0 sm:inline">
                  {formatTotalCost(getTotalEstimatedCost(selectedQuantities))}
                </span>
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button className="mt-3 w-full rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 text-sm font-semibold text-black transition-all hover:shadow-lg hover:shadow-green-400/30">
            Get Started with This Plan
          </button>
        </div>
      </section>
    </div>
  );
};

const faqs = [
  {
    number: "01",
    question: "What is ZenVoice?",
    answer:
      "ZenVoice is a powerful AI-powered voice API platform that enables you to build and integrate AI voice agents into your apps, websites, or workflows. It's designed to help businesses automate voice interactions with natural, real-time communication.",
  },
  {
    number: "02",
    question: "How does ZenVoice work?",
    answer:
      "ZenVoice connects to LLMs (like GPT) via our API and handles real-time voice input and output. You send a request with voice input, and ZenVoice processes, interprets, and responds using natural language—just like a human agent would.",
  },
  {
    number: "03",
    question: "Can I use ZenVoice in my own application",
    answer:
      "Absolutely. ZenVoice provides a flexible API you can easily integrate into your app, website, or any workflow that requires conversational voice automation.",
  },
  {
    number: "04",
    question: "What are some use cases for ZenVoice?",
    answer:
      "ZenVoice is ideal for customer support bots, voice assistants, appointment booking, sales calls, IVR systems, and voice-driven workflows across industries like e-commerce, healthcare, SaaS, and fintech.",
  },
  {
    number: "05",
    question: "What languages does ZenVoice support?",
    answer:
      "ZenVoice supports most languages, with a focus on regional languages for better accessibility.",
  },
  {
    number: "06",
    question: "Is real-time voice response supported?",
    answer:
      "Yes! ZenVoice supports low-latency, real-time streaming so conversations feel natural and immediate.",
  },
  {
    number: "07",
    question: "How secure is ZenVoice?",
    answer:
      "We take data security seriously. ZenVoice uses encryption protocols and secure API practices to ensure your data is protected at all times.",
  },
  {
    number: "08",
    question: "Can I customize the voice and tone of the AI agent?",
    answer:
      "Yes. You can customize voices, tones, personalities, and even the logic behind the conversation flow using your preferred LLM prompts.",
  },
];

const Services = () => {
  const [selectedItem, setSelectedItem] = useState<number>(2);
  const [openStates, setOpenStates] = useState<{ [key: number]: boolean }>({});

  // Multilingual Voices State
  const [selectedLanguage, setSelectedLanguage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
  const [audioData, setAudioData] = useState<number[]>(new Array(50).fill(0));
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Language audio data - Add your audio files to public/audios/ folder
  const languageAudios = [
    { name: "Tamil", src: "/audios/TAMIL.mp3", icon: "ழ" },
    { name: "Telugu", src: "/audios/TELUGU.mp3", icon: "తె" },
    { name: "Malayalam", src: "/audios/MAL.mp3", icon: "അ" },
    { name: "Hindi", src: "/audios/HINDI.mp3", icon: "अ" },
    { name: "Kannada", src: "/audios/KANNADA.mp3", icon: "ಕ" },
    { name: "English", src: "/audios/ENG.mp3", icon: "En" },
  ];

  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Generate random audio bars animation
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setAudioData((prevData) => prevData.map(() => Math.random() * 100));
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioData(new Array(50).fill(0));
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Update progress and load audio metadata
  useEffect(() => {
    const currentAudio = audioRefs.current[selectedLanguage];
    if (!currentAudio) return;

    const updateTime = () => {
      setCurrentTime(currentAudio.currentTime);
    };

    const updateDuration = () => {
      if (currentAudio.duration && !isNaN(currentAudio.duration)) {
        setDuration(currentAudio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (currentAudio.duration && !isNaN(currentAudio.duration)) {
        setDuration(currentAudio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    if (currentAudio.readyState >= 1) {
      handleLoadedMetadata();
    }

    currentAudio.addEventListener("timeupdate", updateTime);
    currentAudio.addEventListener("loadedmetadata", handleLoadedMetadata);
    currentAudio.addEventListener("durationchange", updateDuration);
    currentAudio.addEventListener("canplay", updateDuration);
    currentAudio.addEventListener("ended", handleEnded);

    currentAudio.load();

    return () => {
      currentAudio.removeEventListener("timeupdate", updateTime);
      currentAudio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      currentAudio.removeEventListener("durationchange", updateDuration);
      currentAudio.removeEventListener("canplay", updateDuration);
      currentAudio.removeEventListener("ended", handleEnded);
    };
  }, [selectedLanguage]);

  const toggleFAQ = (index: number) => {
    setOpenStates((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleLanguageSelect = (index: number) => {
    // Pause current audio if playing
    if (isPlaying && audioRefs.current[selectedLanguage]) {
      audioRefs.current[selectedLanguage]?.pause();
      setIsPlaying(false);
    }

    // Reset all audios to start
    audioRefs.current.forEach((audio) => {
      if (audio) audio.currentTime = 0;
    });

    setSelectedLanguage(index);
    setCurrentTime(0);
  };

  const handlePlayPause = () => {
    const currentAudio = audioRefs.current[selectedLanguage];

    if (!currentAudio) return;

    if (isPlaying) {
      currentAudio.pause();
      setIsPlaying(false);
    } else {
      // Pause all other audios
      audioRefs.current.forEach((audio, idx) => {
        if (audio && idx !== selectedLanguage) {
          audio.pause();
          audio.currentTime = 0;
        }
      });

      currentAudio.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const currentAudio = audioRefs.current[selectedLanguage];
    if (!currentAudio || !duration) return;

    const progressBar = e.currentTarget;
    const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
    const progressBarWidth = progressBar.offsetWidth;
    const clickPercentage = clickPosition / progressBarWidth;

    currentAudio.currentTime = clickPercentage * duration;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Section id="how-to-use">
      <div className="container -mt-20">
        <Heading
          title="Frequently Asked Questions."
          className="text-green-300"
        />

        <div className="relative">
          <div className="relative z-10 mb-10 flex min-h-[39rem] items-center overflow-hidden rounded-3xl p-8 lg:p-20 xl:min-h-[46rem] mt-[-1.25rem]">
            {/* Gradient Border */}
            <div
              className="absolute inset-0 rounded-3xl p-[1px]"
              style={{
                background:
                  "linear-gradient(to right, #4ade809c, #3b83f667, #4ade809d)",
              }}
            >
              <div className="w-full h-full rounded-3xl bg-n-8"></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 w-full max-w-full mb-40">
              <div className="grid gap-6 lg:grid-cols-2">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/40 bg-n-7/50 p-6 backdrop-blur-sm transition-all hover:border-white/70"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Number */}
                      <div className="text-sm font-semibold text-n-3">
                        {faq.number}
                      </div>

                      {/* Question and Answer */}
                      <div className="flex-1 space-y-2">
                        <div
                          onClick={() => toggleFAQ(index)}
                          className={cn(
                            "cursor-pointer font-semibold transition-colors",
                            openStates[index] ? "text-color-1" : "text-n-1",
                          )}
                        >
                          {faq.question}
                        </div>

                        {/* Answer */}
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            openStates[index]
                              ? "max-h-96 opacity-100 mt-2"
                              : "max-h-0 opacity-0",
                          )}
                        >
                          <p className="text-sm text-n-3 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>

                      {/* Toggle button */}
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="ml-2 text-xl font-bold text-n-3 transition-colors hover:text-n-1"
                      >
                        {openStates[index] ? "×" : "+"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Generating className="absolute inset-x-4 bottom-6 border border-n-1/10 lg:bottom-8 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 mb-15" />
          </div>

          <div className="relative z-1 grid gap-5 lg:grid-cols-2">
            {/* FIX: Added w-full max-w-full to contain the calculator and prevent horizontal overflow */}
            <div className="relative min-h-[39rem] overflow-hidden rounded-3xl border border-n-1/10 bg-n-7 p-4 lg:min-h-[46rem] w-full max-w-full">
              <PricingCalculator />
            </div>

            <div className="overflow-hidden rounded-3xl bg-n-7 p-4 lg:min-h-[46rem]">
              <div className="px-4 py-12 xl:px-8">
                <h4 className="h4 mb-4 text-green-400">
                  Look Our Multilingual Voices{" "}
                </h4>
                <p className="body-2 mb-8 text-n-3">
                  The world's most powerful AI Speech to Speech. What will you
                  create?
                </p>

                <ul className="flex items-center justify-between gap-2 md:gap-4">
                  {languageAudios.map((item, index) => (
                    <li
                      key={index}
                      onClick={() => handleLanguageSelect(index)}
                      className={cn(
                        "group relative flex items-center justify-center rounded-2xl cursor-pointer transition-all duration-300",
                        index === selectedLanguage
                          ? "w-[3rem] h-[3rem] p-0.25 bg-conic-gradient md:w-[4.5rem] md:h-[4.5rem] ring-2 ring-color-1"
                          : "w-10 h-10 bg-n-6 md:w-15 md:h-15 hover:bg-n-5",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-full items-center justify-center rounded-2xl text-xl md:text-2xl",
                          index === selectedLanguage ? "bg-n-7" : "",
                        )}
                      >
                        {item.icon}
                      </div>
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-n-8 px-2 py-1 text-xs text-n-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {item.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative h-80 overflow-hidden rounded-xl bg-n-8 md:h-[25rem] flex flex-col justify-between p-8">
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 1200 400"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,200 Q300,150 600,200 T1200,200 L1200,400 L0,400 Z"
                      fill="url(#wave-gradient)"
                      className={isPlaying ? "animate-wave" : ""}
                    >
                      {isPlaying && (
                        <animate
                          attributeName="d"
                          dur="3s"
                          repeatCount="indefinite"
                          values="
                            M0,200 Q300,150 600,200 T1200,200 L1200,400 L0,400 Z;
                            M0,200 Q300,250 600,200 T1200,200 L1200,400 L0,400 Z;
                            M0,200 Q300,150 600,200 T1200,200 L1200,400 L0,400 Z
                          "
                        />
                      )}
                    </path>
                    <path
                      d="M0,220 Q300,170 600,220 T1200,220 L1200,400 L0,400 Z"
                      fill="url(#wave-gradient-2)"
                      opacity="0.1"
                      className={isPlaying ? "animate-wave-slow" : ""}
                    >
                      {isPlaying && (
                        <animate
                          attributeName="d"
                          dur="4s"
                          repeatCount="indefinite"
                          values="
                            M0,220 Q300,170 600,220 T1200,220 L1200,400 L0,400 Z;
                            M0,220 Q300,270 600,220 T1200,220 L1200,400 L0,400 Z;
                            M0,220 Q300,170 600,220 T1200,220 L1200,400 L0,400 Z
                          "
                        />
                      )}
                    </path>
                    <defs>
                      <linearGradient
                        id="wave-gradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#1eff0065" />
                        <stop offset="100%" stopColor="#66ff00ff" />
                      </linearGradient>
                      <linearGradient
                        id="wave-gradient-2"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#33ff009f" />
                        <stop offset="100%" stopColor="#c300ffea" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="relative z-10 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <span className="text-xl">🎵</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-n-1">
                      {isPlaying
                        ? `You're listening ${languageAudios[selectedLanguage].name} audio now!`
                        : `${languageAudios[selectedLanguage].name} audio ready to play`}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-n-3">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePlayPause}
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-n-6 text-n-1 transition-all hover:bg-n-5"
                    >
                      {isPlaying ? (
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <div
                      className="relative h-1 flex-1 overflow-hidden rounded-full bg-n-6 cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-150"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {languageAudios.map((audio, index) => (
                  <audio
                    key={index}
                    ref={(el) => {
                      if (el) audioRefs.current[index] = el;
                    }}
                    src={audio.src}
                    preload="metadata"
                  />
                ))}
              </div>
            </div>
            <Gradient />
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Services;
