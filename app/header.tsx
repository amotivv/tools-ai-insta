"use client"

import { Share2, Download, HelpCircle, LogOut, Crown, Settings } from "lucide-react"
import { signOut, useSession, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PremiumSettings } from "./premium-settings"
import { getUserPreferences, updateUserPreferences, checkUserPremiumStatus } from "./premium-actions"
import type { UserPreferences } from "./premium-actions"

interface HeaderProps {
  onDownloadAll: () => void
  onShare: () => Promise<string>
  onShowTour?: () => void
}

export function Header({ onDownloadAll, onShare, onShowTour }: HeaderProps) {
  const { data: session, update: updateSession } = useSession()
  const [isSharing, setIsSharing] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  useEffect(() => {
    const loadPremiumData = async () => {
      const [premiumStatus, userPrefs] = await Promise.all([
        checkUserPremiumStatus(),
        getUserPreferences()
      ])
      setIsPremium(premiumStatus)
      if (userPrefs) {
        // Convert Decimal to number before setting state
        setPreferences({
          ...userPrefs,
          guidanceScale: Number(userPrefs.guidanceScale)
        })
      } else {
        setPreferences(null)
      }
    }

    if (session?.user) {
      loadPremiumData()
    }
  }, [session?.user])

  const handleUpdatePreferences = async (newPreferences: UserPreferences) => {
    const success = await updateUserPreferences(newPreferences)
    if (success) {
      setPreferences(newPreferences)
    }
    return success
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      await onShare()
    } catch (error) {
      console.error("Error sharing feed:", error)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 py-4 border-b border-light-gray">
      <div className="text-xl font-mono flex items-center">
        <Share2 className="w-6 h-6 mr-2 text-primary" />
        <span className="text-primary font-semibold">AI-stagram</span>
        {session?.user?.tier === "PREMIUM" && (
          <Badge 
            variant="default" 
            className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center gap-1"
          >
            <Crown className="w-3 h-3" />
            {isPremium ? "PREMIUM" : "BASIC"}
          </Badge>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {session?.user && (
          <>
            {isPremium && preferences && (
              <PremiumSettings
                isPremium={isPremium}
                initialPreferences={preferences}
                onUpdate={handleUpdatePreferences}
              />
            )}
            {onShowTour && (
              <Button 
              variant="ghost" 
              size="icon" 
              onClick={async () => {
                await updateSession()
                onShowTour?.()
              }}
            >
                <HelpCircle className="w-6 h-6 text-dark-gray" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} disabled={isSharing}>
              {isSharing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Share2 className="w-6 h-6 text-dark-gray" />
                </motion.div>
              ) : (
                <Share2 className="w-6 h-6 text-dark-gray" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDownloadAll}>
              <Download className="w-6 h-6 text-dark-gray" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
            >
              <LogOut className="w-6 h-6 text-dark-gray" />
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
