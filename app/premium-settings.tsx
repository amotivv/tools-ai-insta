"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings, Crown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { UserPreferences } from "./premium-actions"

interface PremiumSettingsProps {
  isPremium: boolean
  initialPreferences: UserPreferences
  onUpdate: (preferences: UserPreferences) => Promise<boolean>
}

const MODEL_LIMITS = {
  "flux-schnell": {
    maxInferenceSteps: 4,
    minInferenceSteps: 2
  },
  "flux-dev": {
    maxInferenceSteps: 50,
    minInferenceSteps: 18
  }
} as const

export function PremiumSettings({ isPremium, initialPreferences, onUpdate }: PremiumSettingsProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...initialPreferences,
    guidanceScale: Number(initialPreferences.guidanceScale)
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleUpdate = async () => {
    try {
      setIsSaving(true)
      const success = await onUpdate(preferences)
      if (success) {
        toast({
          title: "Settings updated",
          description: "Your premium settings have been saved.",
        })
        setIsOpen(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to update settings. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const modelLimits = MODEL_LIMITS[preferences.modelType as keyof typeof MODEL_LIMITS]

  if (!isPremium) return null

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
          <Crown className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 absolute -top-0.5 -right-0.5 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] sm:h-[85vh] pb-8 pt-6">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Premium Settings
          </SheetTitle>
          <SheetDescription>
            Customize your AI image generation settings
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-10rem)] px-4">
          {/* Model Quality */}
          <div className="space-y-2">
            <Label>Model Quality</Label>
            <Select
              value={preferences.modelType}
              onValueChange={(value) => {
                const newModelType = value as keyof typeof MODEL_LIMITS
                const newLimits = MODEL_LIMITS[newModelType]
                
                setPreferences((prev) => ({
                  ...prev,
                  modelType: value,
                  // Auto-adjust inference steps when switching models
                  inferenceSteps: Math.min(
                    Math.max(prev.inferenceSteps, newLimits.minInferenceSteps),
                    newLimits.maxInferenceSteps
                  )
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flux-schnell">Flux Schnell (Fast)</SelectItem>
                <SelectItem value="flux-dev">Flux Dev (High Quality)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Flux Dev offers higher quality but takes longer to generate
            </p>
          </div>

          {/* Safety Filter */}
          <div className="space-y-2">
            <Label>Safety Filter</Label>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Filter potentially inappropriate content
              </p>
              <Switch
                checked={preferences.safetyCheckerEnabled}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({
                    ...prev,
                    safetyCheckerEnabled: checked,
                  }))
                }
              />
            </div>
          </div>

          {/* Inference Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Inference Steps</Label>
              <span className="text-sm text-muted-foreground">
                {preferences.inferenceSteps}
              </span>
            </div>
            <Slider
              min={modelLimits.minInferenceSteps}
              max={modelLimits.maxInferenceSteps}
              step={1}
              value={[preferences.inferenceSteps]}
              onValueChange={([value]) =>
                setPreferences((prev) => ({ ...prev, inferenceSteps: value }))
              }
            />
            <p className="text-sm text-muted-foreground">
              {preferences.modelType === "flux-schnell" 
                ? `Fast generation with 2-4 steps`
                : `Higher quality with 18-50 steps (takes longer)`}
            </p>
          </div>

          {/* Guidance Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Guidance Scale</Label>
              <span className="text-sm text-muted-foreground">
                {preferences.guidanceScale.toFixed(1)}
              </span>
            </div>
            <Slider
              min={3}
              max={6}
              step={0.1}
              value={[preferences.guidanceScale]}
              onValueChange={([value]) =>
                setPreferences((prev) => ({ ...prev, guidanceScale: value }))
              }
            />
            <p className="text-sm text-muted-foreground">
              How closely to follow the prompt (3-6)
            </p>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select
              value={preferences.aspectRatio}
              onValueChange={(value) =>
                setPreferences((prev) => ({ ...prev, aspectRatio: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">Square (1:1)</SelectItem>
                <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                <SelectItem value="2:3">Portrait (2:3)</SelectItem>
                <SelectItem value="9:16">Story (9:16)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the shape of your generated images
            </p>
          </div>

          <Button 
            className="w-full mt-8" 
            onClick={handleUpdate}
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
