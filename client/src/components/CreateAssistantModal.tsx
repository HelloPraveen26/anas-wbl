"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAssistant: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export function CreateAssistantModal({
  open,
  onOpenChange,
  onCreateAssistant,
  isLoading = false,
}: CreateAssistantModalProps) {
  const [assistantName, setAssistantName] = useState("");

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        handleCancel();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantName.trim()) return;

    try {
      await onCreateAssistant(assistantName.trim());
      setAssistantName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating assistant:", error);
    }
  };

  const handleCancel = () => {
    setAssistantName("");
    onOpenChange(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create New Assistant
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter a name for your new assistant. It will be created with default
            settings that you can customize later.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Name
            </Label>
            <Input
              id="name"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="Enter assistant name"
              disabled={isLoading}
              autoFocus
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!assistantName.trim() || isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? "Creating..." : "Create Assistant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
