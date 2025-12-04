"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
// Changed: Using direct path instead of import for GIF
import Section from "../../layout/section";
import { cn } from "@/lib/utils";
import { BackgroundCircles, Gradient } from "../../design/hero";
import { ScrollParallax } from "react-just-parallax";
import CompanyLogos from "./company-logos";
import {
  BsFillPlayFill,
  BsPauseFill,
  BsVolumeMuteFill,
  BsVolumeUpFill,
} from "react-icons/bs";
import Button from "../../atoms/button";

// Import the GIF with explicit typing


const Hero = () => {
  const parallaxRef = useRef(null);
  const heroSectionRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- Video state ---
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);

  // --- Scroll & zoom ---
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("down");
  const [zoomLevel, setZoomLevel] = useState(1);

  // --- Word cycling ---
  const words = [
    "Pre Sales Layer",
    "Reminder and Notify",
    "Book Appointments",
    "Follow Up Calls",
    "Answer Customer Queries",
  ];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- Video controls ---
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) video.play().catch((err) => console.log(err));
      else video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
      video.volume = video.muted ? 0 : 1;
    }
  }, [isMuted]);

  const toggleLoop = useCallback(() => setIsLooping((prev) => !prev), []);

  // --- Autoplay setup ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    video.muted = true;
    video.play().catch((err) => {
      console.warn("Autoplay prevented:", err);
      setIsPlaying(false);
    });

    const enableAudio = () => {
      if (video) {
        video.muted = false;
        video.volume = 1;
        video.play().catch((err) => console.warn("Audio play failed:", err));
        setIsMuted(false);
        window.removeEventListener("click", enableAudio);
      }
    };
    window.addEventListener("click", enableAudio);

    return () => {
      window.removeEventListener("click", enableAudio);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  // --- Sync loop ---
  useEffect(() => {
    if (videoRef.current) videoRef.current.loop = isLooping;
  }, [isLooping]);

  // --- Scroll zoom & pause effect ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const video = videoRef.current;

      const newScrollDirection = currentScrollY > lastScrollY ? "down" : "up";
      setScrollDirection(newScrollDirection);
      setLastScrollY(currentScrollY);

      const zoomIncrement = Math.abs(currentScrollY - lastScrollY) * 0.0003;
      setZoomLevel((prev) =>
        newScrollDirection === "down"
          ? Math.min(prev + zoomIncrement, 1.15)
          : Math.max(prev - zoomIncrement, 1.0)
      );

      if (video) {
        const videoRect = video.getBoundingClientRect();
        const isVideoScrolledPast = videoRect.bottom < 0;

        if (isVideoScrolledPast && !video.paused) {
          video.pause();
        } else if (
          !isVideoScrolledPast &&
          video.paused &&
          newScrollDirection === "up"
        ) {
          video.play().catch((err) =>
            console.log("Play prevented on scroll up:", err)
          );
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // --- Word cycling ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsTransitioning(true);
      const t = setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsTransitioning(false);
      }, 800);
      return () => clearTimeout(t);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [currentWordIndex, words.length]);

  return (
    <Section
      className={cn("pt-[12rem] -mt-[5.25rem] relative overflow-hidden")}
      crosses
      crossesOffset="lg:translate-y-[5.25rem]"
      customPaddings
      id="hero"
      ref={heroSectionRef}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-center bg-cover"
        style={{ backgroundImage: "url('/assets/thalavali.png')" }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-0 bg-black/15" />

      {/* Hero content */}
      <div className="relative z-10 container" ref={parallaxRef}>
        {/* Christmas GIF - with error handling */}
        <style jsx>{`
  @keyframes moveFade {
    0% {
      transform: translateX(100vw);
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      transform: translateX(-100vw);
      opacity: 0;
    }
  }
  .move-fade {
    position: absolute;
    top: -60px;
    left: 0;
    animation: moveFade 30s linear infinite;
    will-change: transform, opacity;
    z-index: 5;
    pointer-events: none;
  }
  @media (min-width: 768px) {
    .move-fade {
      top: -80px;
    }
  }
  @media (min-width: 1024px) {
    .move-fade {
      top: -100px;
    }
  }
`}</style>

        {/* Heading */}
        <div className="relative z-1 mx-auto mb-16 max-w-[62rem] text-center md:mb-26 lg:-mt-26 " >
          {/* Christmas GIF positioned above heading */}
          <img
            src="/assets/hero/crist.gif"
            alt="Christmas decoration"
            className="move-fade w-auto h-20 md:h-32 lg:h-40  object-contain drop-shadow-lg -mt-8"
            loading="eager"
            onError={(e) => {
              console.error("Failed to load Christmas GIF");
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="h1 mb-6 mt-12">
            Our Zenvoice AI agents makes{" "}
            <span className="relative inline-block text-green-500 overflow-hidden h-[2em] min-w-[350px] text-center flex items-center justify-center lg:-mt-4">
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out transform",
                  isTransitioning
                    ? "-translate-y-full opacity-0"
                    : "translate-y-0 opacity-100"
                )}
              >
                <span className="font-semibold whitespace-nowrap text-center -mt-17 text-2xl md:text-4xl lg:text-5xl">
                  {words[currentWordIndex]}
                </span>
              </div>
            </span>
          </h1>

          <p className="body-1 max-w-3xl mx-auto mb-6 text-n-2 lg:mt-19 -mt-12">
            Build smart Voice AI agents in minutes. No coding, <br />
            no complex setup—just plug and play
          </p>

          <Button
            href="https://moanalisha.fillout.com/11-with-monalisha"
            target="_blank"
            rel="noopener noreferrer"
            className="relative overflow-hidden rounded-lg px-6 py-3 font-semibold text-white bg-gradient-to-r to-emerald-600 shadow-md transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg -mb-18"
          >
            <span className="relative z-10">Talk to Sales</span>
            <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 transition-opacity duration-500 ease-in-out hover:opacity-20" />
          </Button>
        </div>
      
        {/* Video Section */}
        <div
          className="relative max-w-[90vw] mx-auto md:max-w-5xl xl:mb-24 -mt-3"
          style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.2s ease-out" }}
        >
          <div className="relative z-1 rounded-2xl p-0.5 bg-conic-gradient">
            <div className="relative bg-n-8 rounded-[1rem]">
              {/* decorative top strip */}
              <div className="h-[1.4rem] md:h-[3.2rem] rounded-t-[0.9rem] bg-n-10" />
              <div className="aspect-[16/9] rounded-b-[0.9rem] overflow-hidden md:aspect-[688/490] lg:aspect-[1024/490]">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  autoPlay
                  muted={isMuted}
                  loop={isLooping}
                  playsInline
                  preload="auto"
                >
                  <source src="/videos/team-video-v2.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Mobile controls */}
                <div className="absolute bottom-4 left-4 flex gap-2 z-20 xl:hidden">
                  <button
                    onClick={togglePlayPause}
                    className="flex items-center justify-center w-12 h-12 rounded-lg bg-n-8/80 backdrop-blur-sm hover:bg-n-7/80 transition-all duration-200 text-white hover:scale-110 active:scale-95"
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? <BsPauseFill size={20} /> : <BsFillPlayFill size={20} />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="flex items-center justify-center w-12 h-12 rounded-lg bg-n-8/80 backdrop-blur-sm hover:bg-n-7/80 transition-all duration-200 text-white hover:scale-110 active:scale-95"
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                  >
                    {isMuted ? <BsVolumeMuteFill size={20} /> : <BsVolumeUpFill size={20} />}
                  </button>
                </div>

                {/* Desktop controls */}
                <ScrollParallax isAbsolutelyPositioned>
                  <ul className="absolute bottom-[7.5rem] left-[-5.5rem] hidden xl:flex ml-10 rounded-2xl border border-n-1/10 bg-n-9/40 p-1 backdrop-blur -ml-1">
                    <li className="p-3">
                      <button
                        onClick={togglePlayPause}
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-n-8/80 hover:bg-n-7/80 transition-all duration-200 text-white hover:scale-110 active:scale-95"
                      >
                        {isPlaying ? <BsPauseFill size={20} /> : <BsFillPlayFill size={20} />}
                      </button>
                    </li>

                    <li className="p-3">
                      <button
                        onClick={toggleMute}
                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-n-8/80 hover:bg-n-7/80 transition-all duration-200 text-white hover:scale-110 active:scale-95"
                      >
                        {isMuted ? <BsVolumeMuteFill size={20} /> : <BsVolumeUpFill size={20} />}
                      </button>
                    </li>
                  </ul>
                </ScrollParallax>
              </div>
            </div>
            <Gradient />
          </div>
          <BackgroundCircles parallaxRef={parallaxRef} />
        </div>

        <CompanyLogos className="relative z-10 mt-12 md:mt-20" />
      </div>
    </Section>
  );
};

export default Hero;