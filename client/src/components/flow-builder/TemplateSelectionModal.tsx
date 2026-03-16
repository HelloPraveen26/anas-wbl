"use client";

import React, { useState, useEffect } from "react";
import {
  User, Settings, Copy, X, Sparkles,
  Search, Target, Rocket, ShoppingCart,
  Headphones, Bell, Megaphone, Hotel,
  BarChart3, Truck, ChevronRight
} from "lucide-react";

import recruitmentTemplate from "./template/recruitment.json";
import leadQualificationTemplate from "./template/lead_qualification.json";
import onboardingTemplate from "./template/onboarding.json";
import cartRecoveryTemplate from "./template/cart_recovery.json";
import customerSupportTemplate from "./template/customer_support.json";
import reminderTemplate from "./template/reminder.json";
import announcementsTemplate from "./template/announcements.json";
import frontDeskTemplate from "./template/front_desk.json";
import surveyTemplate from "./template/survey.json";
import logisticsTemplate from "./template/logistics.json";

interface TemplateSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectScratch: () => void;
  onSelectTemplate: (templateJson: any, title: string) => void;
}

export function TemplateSelectionModal({
  open,
  onOpenChange,
  onSelectScratch,
  onSelectTemplate,
}: TemplateSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<"create" | "prebuilt">("prebuilt");
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);

  // Professional mapping of icons to agents
  const prebuiltAgents = [
    { icon: Search, title: "Recruitment Agent", description: "Screen, interview, and onboard candidates at scale.", template: recruitmentTemplate },
    { icon: Target, title: "Lead Qualification", description: "Instantly qualify leads and handle initial discovery.", template: leadQualificationTemplate },
    { icon: Rocket, title: "Onboarding Agent", description: "Guided walkthroughs to ensure user success.", template: onboardingTemplate },
    { icon: ShoppingCart, title: "Cart Recovery", description: "Recover lost sales with timely automated follow-ups.", template: cartRecoveryTemplate },
    { icon: Headphones, title: "Customer Support", description: "24/7 inbound handling for FAQs and triage.", template: customerSupportTemplate },
    { icon: Bell, title: "Reminder Agent", description: "Automate EMI, collections, and deadline alerts.", template: reminderTemplate },
    { icon: Megaphone, title: "Announcements", description: "Broadcasting product updates and feature launches.", template: announcementsTemplate },
    { icon: Hotel, title: "Front Desk Agent", description: "Managing scheduling for clinics, hotels, and offices.", template: frontDeskTemplate },
    { icon: BarChart3, title: "Survey Agent", description: "Gather deep feedback with automated NPS surveys.", template: surveyTemplate },
    { icon: Truck, title: "Logistics Agent", description: "Handling COD confirmations and last-mile tasks.", template: logisticsTemplate },
  ];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onOpenChange(false);
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 transition-all duration-500"
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div className="bg-white rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-300 border border-slate-200/60">

        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 text-slate-400 hover:text-emerald-600 transition-all z-20 p-2 hover:bg-emerald-50 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-12 flex-1 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-widest mb-4 border border-emerald-100">
              <Sparkles className="w-3.5 h-3.5 fill-emerald-500" />
              Template Library
            </div>
            <h2 className="text-[30px] font-bold text-slate-900 mb-2 tracking-tight">How can AI help you today?</h2>
            <p className="text-slate-500 text-[16px]">Select a blueprint to instantly deploy a pre-trained agent.</p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl mb-10 w-full max-w-md mx-auto md:mx-0">
            <button
              onClick={() => setActiveTab("prebuilt")}
              className={`py-2.5 rounded-xl text-[14px] font-semibold transition-all ${activeTab === "prebuilt"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Templates
            </button>
            <button
              onClick={() => {
                onOpenChange(false);
                onSelectScratch();
              }}
              className={`py-2.5 rounded-xl text-[14px] font-semibold transition-all ${activeTab === "create"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              Custom Agent
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prebuiltAgents.map((agent, index) => {
              const Icon = agent.icon;
              const isSelected = selectedAgent === index;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAgent(index);
                    onOpenChange(false);
                    onSelectTemplate(agent.template, agent.title);
                  }}
                  className={`group relative flex items-start gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden ${isSelected
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-50 bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1"
                    }`}
                >
                  {/* Magical Hover Glow - Subtle Radial Gradient */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_70%)]" />

                  {/* Icon Container */}
                  <div className={`mt-0.5 p-2.5 rounded-xl transition-all duration-300 ${isSelected
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                    }`}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold text-[15.5px] transition-colors ${isSelected ? "text-emerald-900" : "text-slate-800"}`}>
                        {agent.title}
                      </h3>
                      {isSelected && <ChevronRight className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className={`text-[13px] leading-relaxed transition-colors ${isSelected ? "text-emerald-700/80" : "text-slate-500"}`}>
                      {agent.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>



        </div>
      </div>
    </div>
  );
}