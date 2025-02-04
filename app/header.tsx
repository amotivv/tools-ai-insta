"use client"

import { Heart, Share2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface HeaderProps {
  onDownloadAll: () => void
  onShare: () => Promise<string>
}

export function Header({ onDownloadAll, onShare }: HeaderProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

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
      </div>
      <div className="flex items-center space-x-4">
        <AnimatePresence>
          <motion.div
            key={`header-like-${isLiked}`}
            initial={{ scale: 1 }}
            animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
            exit={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button variant="ghost" size="icon" onClick={() => setIsLiked(!isLiked)}>
              <Heart className={`w-6 h-6 ${isLiked ? "fill-primary text-primary" : "text-dark-gray"}`} />
            </Button>
          </motion.div>
        </AnimatePresence>
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
      </div>
    </header>
  )
}

