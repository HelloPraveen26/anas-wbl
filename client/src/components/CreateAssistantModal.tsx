"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateAssistantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAssistant: (name: string) => Promise<void>
  isLoading?: boolean
}

export function CreateAssistantModal({
  open,
  onOpenChange,
  onCreateAssistant,
  isLoading = false,
}: CreateAssistantModalProps) {
  const [assistantName, setAssistantName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assistantName.trim()) return

    try {
      await onCreateAssistant(assistantName.trim())
      setAssistantName("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating assistant:", error)
    }
  }

  const handleCancel = () => {
    setAssistantName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Assistant</DialogTitle>
          <DialogDescription>
            Enter a name for your new assistant. It will be created with default
            settings that you can customize later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                placeholder="Enter assistant name"
                className="col-span-3"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
