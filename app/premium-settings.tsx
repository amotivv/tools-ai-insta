"use client"

import { useState, useCallback } from "react"
import { debounce } from "@/lib/utils"
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
import { Settings, Crown, Loader2 } from "lucide-react"
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
  const [savingStates, setSavingStates] = useState<Record<keyof UserPreferences, boolean>>({
    modelType: false,
    safetyCheckerEnabled: false,
    inferenceSteps: false,
    guidanceScale: false,
    aspectRatio: false
  })
  const { toast } = useToast()

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (newPreferences: UserPreferences, key: keyof UserPreferences) => {
      setSavingStates(prev => ({ ...prev, [key]: true }))
      try {
        const success = await onUpdate(newPreferences)
        if (success) {
          toast({
            description: "Settings saved",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to save changes",
            variant: "destructive",
          })
        }
      } finally {
        setSavingStates(prev => ({ ...prev, [key]: false }))
      }
    }, 500),
    [onUpdate, toast]
  )

  // Helper to update preferences and trigger save
  const updatePreference = useCallback((key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    debouncedUpdate(newPreferences, key)
  }, [preferences, debouncedUpdate])

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
      <SheetContent side="bottom" className="h-[75vh] sm:h-[80vh] pb-6 pt-6">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Premium Settings
          </SheetTitle>
          <SheetDescription>
            Customize your AI image generation settings
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(75vh-8rem)] sm:max-h-[calc(80vh-8rem)] px-4">
          {/* Model Quality */}
          <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Model Quality</Label>
                {savingStates.modelType && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                )}
              </div>
            <Select
              value={preferences.modelType}
              onValueChange={(value) => {
                const newModelType = value as keyof typeof MODEL_LIMITS
                const newLimits = MODEL_LIMITS[newModelType]
                
                const newPreferences = {
                  ...preferences,
                  modelType: value,
                  // Auto-adjust inference steps when switching models
                  inferenceSteps: Math.min(
                    Math.max(preferences.inferenceSteps, newLimits.minInferenceSteps),
                    newLimits.maxInferenceSteps
                  )
                }
                setPreferences(newPreferences)
                debouncedUpdate(newPreferences, 'modelType')
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
            <div className="flex items-center gap-2">
              <Label>Safety Filter</Label>
              {savingStates.safetyCheckerEnabled && (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Filter potentially inappropriate content
              </p>
              <Switch
                checked={preferences.safetyCheckerEnabled}
                onCheckedChange={(checked) => 
                  updatePreference('safetyCheckerEnabled', checked)
                }
              />
            </div>
          </div>

          {/* Inference Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Inference Steps</Label>
                {savingStates.inferenceSteps && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                )}
              </div>
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
                updatePreference('inferenceSteps', value)
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
              <div className="flex items-center gap-2">
                <Label>Guidance Scale</Label>
                {savingStates.guidanceScale && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                )}
              </div>
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
                updatePreference('guidanceScale', value)
              }
            />
            <p className="text-sm text-muted-foreground">
              How closely to follow the prompt (3-6)
            </p>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Aspect Ratio</Label>
              {savingStates.aspectRatio && (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <Select
              value={preferences.aspectRatio}
              onValueChange={(value) =>
                updatePreference('aspectRatio', value)
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

        </div>
      </SheetContent>
    </Sheet>
  )
}
