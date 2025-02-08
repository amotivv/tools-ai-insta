"use client"

import { Share2, Download, HelpCircle, LogOut, Crown, Settings, MoreVertical } from "lucide-react"
import { signOut, useSession, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 py-4 border-b border-light-gray">
      <div className="text-lg sm:text-xl font-mono flex items-center">
        <Share2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary" />
        <span className="text-primary font-semibold">AI-stagram</span>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
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
                className="hidden sm:flex"
              >
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-dark-gray" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} disabled={isSharing}>
              {isSharing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-dark-gray" />
                </motion.div>
              ) : (
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-dark-gray" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onDownloadAll}>
              <Download className="w-5 h-5 sm:w-6 sm:h-6 text-dark-gray" />
            </Button>
            
            {/* Account menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5 text-dark-gray" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {onShowTour && (
                  <DropdownMenuItem onClick={async () => {
                    await updateSession()
                    onShowTour?.()
                  }} className="sm:hidden">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  )
}
