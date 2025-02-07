"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { generateImage, generatePrompts, generatePhotoSubjects, generatePhotoStyles, likeImage } from "./actions"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Heart, Send, Bookmark, Loader2, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Header } from "./header"
import JSZip from "jszip"
import { AI_TYPES } from "./constants"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

const MAX_IMAGES = 20

interface Post {
  id: string
  image: string | null
  likes: number
  isLiked: boolean
  isBookmarked: boolean
  comments: string[]
}

interface AIProfile {
  type: string
  photoSubject: string
  photoStyle: string
  name: string
}

export function InstagramFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [prompts, setPrompts] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [aiProfile, setAIProfile] = useState<AIProfile>({ type: "", photoSubject: "", photoStyle: "", name: "" })
  const [isCreatingAI, setIsCreatingAI] = useState(true)
  const [currentAITypeIndex, setCurrentAITypeIndex] = useState(0)
  const [photoSubjects, setPhotoSubjects] = useState<string[]>([])
  const [photoStyles, setPhotoStyles] = useState<string[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [isLoadingStyles, setIsLoadingStyles] = useState(false)
  const [expandedSection, setExpandedSection] = useState<"aiType" | "photoSubject" | "photoStyle" | "aiName">("aiType")
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastPostRef = useRef<HTMLDivElement | null>(null)
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set())
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  const loadingMessages = [
    "Creating your AI Instagram feed...",
    "This is gonna be good...",
    "Almost there...",
    "Generating amazing content...",
    "Making it Instagram-worthy...",
    "Adding those finishing touches...",
    "Just a few more seconds...",
    "Your feed is coming to life..."
  ]

  const driverObj = useRef(
    driver({
      showProgress: true,
      allowClose: true,
      showButtons: ["close"],
      popoverClass: 'driver-popover-allow-interaction',
      steps: [
        {
          element: '[data-tour="ai-type"]',
          popover: {
            title: 'Choose Your AI Type',
            description: 'Select what kind of content creator your AI will be - from food photographer to travel blogger.',
            side: "bottom",
            align: 'start'
          }
        },
        {
          element: '[data-tour="photo-subject"]',
          popover: {
            title: 'AI-Generated Subjects',
            description: 'GPT-4 analyzes your AI type to suggest trending and relevant photo subjects.',
            side: "right",
          }
        },
        {
          element: '[data-tour="photo-style"]',
          popover: {
            title: 'Visual Style',
            description: 'Pick a style for your photos. AI matches complementary styles to your chosen subject.',
            side: "left",
          }
        }
      ]
    })
  )

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0])

  const visibleAITypes = useMemo(() => {
    const start = currentAITypeIndex
    const end = start + 5
    const wrappedTypes = [...AI_TYPES.slice(start), ...AI_TYPES.slice(0, end)].slice(0, 5)
    return wrappedTypes
  }, [currentAITypeIndex])

  const cycleAITypes = useCallback(() => {
    setCurrentAITypeIndex((prevIndex) => (prevIndex + 5) % AI_TYPES.length)
  }, [])

  const handleAITypeSelect = useCallback(async (type: string) => {
    setAIProfile((prev) => ({ ...prev, type, photoSubject: "", photoStyle: "" }))
    setIsLoadingSubjects(true)
    try {
      const result = await generatePhotoSubjects(type)
      if (result.success) {
        setPhotoSubjects(result.data)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Failed to load photo subjects:", error)
      toast.error("Failed to load photo subjects. Please try again.")
    } finally {
      setIsLoadingSubjects(false)
    }
  }, [])

  const handlePhotoSubjectSelect = useCallback(async (subject: string) => {
    setAIProfile((prev) => ({ ...prev, photoSubject: subject, photoStyle: "" }))
    setIsLoadingStyles(true)
    try {
      const result = await generatePhotoStyles(aiProfile.type, subject)
      if (result.success) {
        setPhotoStyles(result.data)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Failed to load photo styles:", error)
      toast.error("Failed to load photo styles. Please try again.")
    } finally {
      setIsLoadingStyles(false)
    }
  }, [aiProfile.type])

  const generateNewPrompts = useCallback(async (profile: AIProfile) => {
    try {
      setIsLoadingPrompts(true)
      const result = await generatePrompts(profile, MAX_IMAGES)
      if (result.success) {
        setPrompts(result.data)
        setPosts([])
        setHasMore(true)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Failed to generate prompts:", error)
      toast.error("Failed to generate prompts")
    } finally {
      setIsLoadingPrompts(false)
    }
  }, [])

  const generateNewPost = useCallback(async () => {
    if (isGenerating || !hasMore || prompts.length === 0 || posts.length >= MAX_IMAGES) return

    try {
      setIsGenerating(true)
      const newPostId = `post_${Date.now()}`
      const promptIndex = posts.length % prompts.length
      const prompt = prompts[promptIndex]

      setPosts((prev) => [
        ...prev,
        {
          id: newPostId,
          image: null,
          likes: 0,
          isLiked: false,
          isBookmarked: false,
          comments: [],
        },
      ])

      const result = await generateImage(prompt, newPostId)
      if (result.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === newPostId ? { ...post, image: result.data } : post
          )
        )
      } else {
        toast.error(result.error)
        setPosts((prev) => prev.filter((post) => post.id !== newPostId))
      }

      if (posts.length + 1 >= MAX_IMAGES) {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to generate image:", error)
      toast.error("Failed to generate image. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, hasMore, prompts, posts.length])

  const handleCreateAI = useCallback(() => {
    if (!aiProfile.type || !aiProfile.photoSubject || !aiProfile.photoStyle || !aiProfile.name) {
      toast.error("Please fill in all fields")
      return
    }
    setIsCreatingAI(false)
    generateNewPrompts(aiProfile)
    setCompletedSections(new Set()) // Reset completed sections
  }, [aiProfile, generateNewPrompts])

  const handleLike = useCallback(async (postId: string) => {
    // Optimistically update UI
    setPosts((prevPosts: Post[]) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          }
          : post,
      ),
    )

    try {
      // Update database
      const result = await likeImage(postId)
      if (!result.success) {
        // Revert on error
        setPosts((prevPosts: Post[]) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes + 1 : post.likes - 1,
              }
              : post,
          ),
        )
        toast.error(result.error)
      }
    } catch (error) {
      console.error("Failed to update likes:", error)
      // Revert on error
      setPosts((prevPosts: Post[]) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes + 1 : post.likes - 1,
            }
            : post,
        ),
      )
      toast.error("Failed to update likes")
    }
  }, [])

  const handleBookmark = useCallback((postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === postId ? { ...post, isBookmarked: !post.isBookmarked } : post)),
    )
  }, [])

  const handleShare = useCallback(
    async (post: Post) => {
      if (!post.image) return

      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = post.image
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Could not get canvas context")

        ctx.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error("Failed to create blob from canvas")
          }
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0]
          link.download = `${aiProfile?.name}_${aiProfile?.photoSubject}_${timestamp}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, "image/png")
      } catch (error) {
        console.error("Failed to download image:", error)
        toast.error("Failed to download image. Please try again.")
      }
    },
    [aiProfile],
  )

  const handleComment = useCallback((postId: string, comment: string) => {
    if (comment.trim() === "") return
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === postId ? { ...post, comments: [...post.comments, comment] } : post)),
    )
  }, [])

  useEffect(() => {
    if (!isCreatingAI) return

    if (completedSections.has('aiType')) {
      // Wait for subjects to be loaded before advancing
      if (photoSubjects.length > 0 && !isLoadingSubjects) {
        driverObj.current.moveNext()
      }
    }
  }, [aiProfile.type, photoSubjects, isLoadingSubjects])

  useEffect(() => {
    if (!isCreatingAI) return

    if (completedSections.has('photoSubject')) {
      // Wait for styles to be loaded before advancing
      if (photoStyles.length > 0 && !isLoadingStyles) {
        driverObj.current.moveNext()
      }
    }
  }, [aiProfile.photoSubject, photoStyles, isLoadingStyles])

  useEffect(() => {
    if (!isCreatingAI) return

    if (completedSections.has('photoStyle')) {
      driverObj.current.moveNext()
    }
  }, [aiProfile.photoStyle])

  useEffect(() => {
    if (!isCreatingAI) return

    if (completedSections.has('aiName')) {
      driverObj.current.moveNext()
    }
  }, [aiProfile.name])

  useEffect(() => {
    const tourShown = localStorage.getItem('aiStagramTourShown')
    if (!tourShown && isCreatingAI) {
      driverObj.current.drive()
      localStorage.setItem('aiStagramTourShown', 'true')
    }
  }, [isCreatingAI])

  useEffect(() => {
    if (!isCreatingAI && prompts.length > 0 && posts.length === 0) {
      generateNewPost()
    }
  }, [isCreatingAI, prompts, posts.length, generateNewPost])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isGenerating && posts.length < MAX_IMAGES) {
          generateNewPost()
        }
      },
      { threshold: 0.1 },
    )

    const currentLastPost = lastPostRef.current
    if (currentLastPost) {
      observer.observe(currentLastPost)
    }

    return () => {
      if (currentLastPost) {
        observer.unobserve(currentLastPost)
      }
    }
  }, [hasMore, isGenerating, generateNewPost, posts.length])

  useEffect(() => {
    if (!isLoadingPrompts) return

    const interval = setInterval(() => {
      setCurrentLoadingMessage(prev => {
        const currentIndex = loadingMessages.indexOf(prev)
        return loadingMessages[(currentIndex + 1) % loadingMessages.length]
      })
    }, 2000) // Change message every 2 seconds

    return () => clearInterval(interval)
  }, [isLoadingPrompts])

  const getAvatarUrl = (name: string) => {
    // Using Dicebear's "initials" style - simple, clean, and professional
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(name)}&backgroundColor=4f46e5`
  }

  const handleShareAll = useCallback(async () => {
    if (posts.length === 0) {
      toast.error("No images to share")
      throw new Error("No images to share")
    }

    const feedToShare = {
      aiProfile: {
        name: aiProfile.name,
        photoSubject: aiProfile.photoSubject,
        photoStyle: aiProfile.photoStyle,
        avatarUrl: getAvatarUrl(aiProfile.name)
      },
      posts: posts.map((post) => ({
        id: post.id,
        image: post.image,
        likes: post.likes,
        comments: post.comments,
      })),
    }

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feed: feedToShare }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate share URL")
      }

      const { shareUrl } = await response.json()
      const fullShareUrl = `${window.location.origin}${shareUrl}`

      // Try Web Share API first (better for mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${aiProfile.name}'s AI Instagram Feed`,
            text: `Check out this AI-generated Instagram feed!`,
            url: fullShareUrl
          })
          toast.success("Shared successfully!")
          return fullShareUrl
        } catch (shareError) {
          console.log("Share failed, falling back to clipboard", shareError)
        }
      }

      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(fullShareUrl)
        toast.success("Share link copied to clipboard!")
      } catch (clipboardError) {
        // Final fallback - show the URL in a toast
        toast.info("Share URL: " + fullShareUrl)
        console.log("Clipboard failed", clipboardError)
      }

      return fullShareUrl
    } catch (error) {
      console.error("Error sharing feed:", error)
      toast.error("Failed to generate share link. Please try again.")
      throw error
    }
  }, [posts, aiProfile])

  const handleDownloadAll = useCallback(async () => {
    if (posts.length === 0) {
      toast.error("No images to download")
      return
    }

    try {
      const zip = new JSZip()
      const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0]

      const imagePromises = posts
        .filter((post) => post.image !== null)
        .map(async (post, index) => {
          const response = await fetch(post.image!)
          const blob = await response.blob()
          const fileName = `${aiProfile?.name}_${aiProfile?.photoSubject}_${index + 1}_${timestamp}.png`
          zip.file(fileName, blob)
        })

      await Promise.all(imagePromises)

      const content = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(content)
      const link = document.createElement("a")
      link.href = url
      link.download = `${aiProfile?.name}_instagram_feed_${timestamp}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Images downloaded successfully!")
    } catch (error) {
      console.error("Failed to download images:", error)
      toast.error("Failed to download images. Please try again.")
    }
  }, [posts, aiProfile])

  const toggleSection = useCallback((section: "aiType" | "photoSubject" | "photoStyle" | "aiName") => {
    setExpandedSection((prev) => (prev === section ? prev : section))
  }, [])

  const handleShowTour = useCallback(() => {
    if (!isCreatingAI) {
      setShowHelpDialog(true)
      return
    }

    // Determine which step to start from
    let startIndex = 0;

    if (completedSections.has('aiType')) {
      if (photoSubjects.length > 0 && !isLoadingSubjects) {
        startIndex = 1; // Photo Subject step
      }
      if (completedSections.has('photoSubject') && photoStyles.length > 0 && !isLoadingStyles) {
        startIndex = 2; // Photo Style step
      }
      if (completedSections.has('photoStyle')) {
        startIndex = 3; // AI Name step
      }
      if (completedSections.has('aiName')) {
        startIndex = 4; // Create button step
      }
    }

    driverObj.current.drive(startIndex);
  }, [completedSections, photoSubjects, isLoadingSubjects, photoStyles, isLoadingStyles])

  return (
    <>
      <Header onDownloadAll={handleDownloadAll} onShare={handleShareAll} onShowTour={handleShowTour} />
      <div className="space-y-6 p-4">
        {isCreatingAI ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Create Your AI Instagram Feed</h2>
            <AnimatePresence>
              {!completedSections.has("aiType") && (
                <motion.div
                  data-tour="ai-type"
                  initial={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-2 pb-2">
                    <label className="block text-sm font-medium text-gray-700">AI Type</label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {visibleAITypes.map((type) => (
                        <Button
                          key={type}
                          variant={aiProfile.type === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            handleAITypeSelect(type)
                            setCompletedSections(new Set(["aiType"]))
                          }}
                          className="capitalize"
                        >
                          {type}
                        </Button>
                      ))}
                      <Button variant="outline" size="sm" onClick={cycleAITypes} className="ml-2">
                        <span className="mr-2">More</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {completedSections.has("aiType") && !completedSections.has("photoSubject") && (
                <div data-tour="photo-subject" className="w-full">
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2 pb-2">
                      <label className="block text-sm font-medium text-gray-700">Photo Subject</label>
                      <div className="flex flex-wrap gap-2">
                        {isLoadingSubjects ? (
                          <div className="flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Loading subjects...
                          </div>
                        ) : (
                          photoSubjects.map((subject) => (
                            <Button
                              key={subject}
                              variant={aiProfile.photoSubject === subject ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                handlePhotoSubjectSelect(subject)
                                setCompletedSections(new Set(["aiType", "photoSubject"]))
                              }}
                              className="capitalize"
                            >
                              {subject}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {completedSections.has("photoSubject") && !completedSections.has("photoStyle") && (
                <div data-tour="photo-style" className="space-y-2">
                  <motion.div
                    data-tour="photo-style"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="space-y-2 pb-2">
                      <label className="block text-sm font-medium text-gray-700">Photo Style</label>
                      <div className="flex flex-wrap gap-2">
                        {isLoadingStyles ? (
                          <div className="flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Loading styles...
                          </div>
                        ) : (
                          photoStyles.map((style) => (
                            <Button
                              key={style}
                              variant={aiProfile.photoStyle === style ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setAIProfile((prev) => ({ ...prev, photoStyle: style }))
                                setCompletedSections(new Set(["aiType", "photoSubject", "photoStyle"]))
                              }}
                              className="capitalize"
                            >
                              {style}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {completedSections.has("photoStyle") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">  {/* Changed to space-y-4 for more space between input and button */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">AI Name</label>
                      <Input
                        type="text"
                        placeholder="Enter a name for your AI"
                        value={aiProfile.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setAIProfile((prev) => ({ ...prev, name: newName }));
                        }}
                        className="w-full"
                      />
                    </div>
                    
                    <Button
                      onClick={handleCreateAI}
                      className="w-full"
                      disabled={!aiProfile.name || aiProfile.name.length < 3}
                    >
                      Create my Instagram AI
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            {isLoadingPrompts && (
              <div className="flex justify-center items-center py-4">
                <div className="flex flex-col items-center w-[400px] space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-center whitespace-nowrap">{currentLoadingMessage}</span>
                </div>
              </div>
            )}

            {posts.map((post, index) => (
              <Card key={post.id} className="overflow-hidden" ref={index === posts.length - 1 ? lastPostRef : null}>
                <div className="p-4 flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage
                      src={aiProfile.name ? getAvatarUrl(aiProfile.name) : "/placeholder.svg"}
                      alt={aiProfile.name || "AI"}
                    />
                    <AvatarFallback>{aiProfile?.name?.charAt(0) || "AI"}</AvatarFallback>
                  </Avatar>
                  <div className="font-semibold">{aiProfile?.name || "AI Creator"}</div>
                </div>

                <div className="aspect-square w-full bg-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                  {post.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image}
                      alt={`AI generated ${aiProfile?.photoStyle} image of ${aiProfile?.photoSubject}`}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
                      onLoad={(e) => {
                        // Once loaded, fade in the image
                        (e.target as HTMLImageElement).style.opacity = "1"
                      }}
                    />
                  )}
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <AnimatePresence>
                        <motion.div
                          key={`like-${post.id}-${post.isLiked}`}
                          initial={{ scale: 1 }}
                          animate={{ scale: post.isLiked ? [1, 1.2, 1] : 1 }}
                          exit={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Button variant="ghost" size="icon" onClick={() => handleLike(post.id)}>
                            <Heart className={`w-6 h-6 ${post.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                          </Button>
                        </motion.div>
                      </AnimatePresence>
                      <Button variant="ghost" size="icon" onClick={() => handleShare(post)}>
                        <Send className="w-6 h-6" />
                      </Button>
                    </div>
                    <AnimatePresence>
                      <motion.div
                        key={`bookmark-${post.id}-${post.isBookmarked}`}
                        initial={{ scale: 1 }}
                        animate={{ scale: post.isBookmarked ? [1, 1.2, 1] : 1 }}
                        exit={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Button variant="ghost" size="icon" onClick={() => handleBookmark(post.id)}>
                          <Bookmark
                            className={`w-6 h-6 ${post.isBookmarked ? "fill-yellow-500 text-yellow-500" : ""}`}
                          />
                        </Button>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="text-sm font-semibold">{post.likes.toLocaleString()} likes</div>
                  <div className="mt-2">
                    <div className="text-sm font-semibold mb-1">{post.comments.length} comments</div>
                    {post.comments.slice(0, 2).map((comment, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-semibold">user{index + 1}</span> {comment}
                      </div>
                    ))}
                    {post.comments.length > 2 && (
                      <div className="text-sm text-gray-500">View all {post.comments.length} comments</div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const input = e.currentTarget.elements.namedItem("comment") as HTMLInputElement
                        handleComment(post.id, input.value)
                        input.value = ""
                      }}
                      className="mt-2 flex"
                    >
                      <Input type="text" name="comment" placeholder="Add a comment..." className="flex-grow" />
                      <Button type="submit" variant="ghost" className="ml-2">
                        Post
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}

            {!hasMore && <div className="text-center text-gray-500 py-8">You've reached the end of the feed!</div>}
          </>
        )}
      </div>
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to AI-stagram!</DialogTitle>
            <DialogDescription className="space-y-4">
              <p className="mb-4">
                AI-stagram is your personal AI-powered Instagram feed generator. Here's what you can do:
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>Like and bookmark generated posts</li>
                <li>Download individual images or the entire feed</li>
                <li>Share your AI-generated feed with others</li>
                <li>Add comments to posts</li>
              </ul>
              <p>
                Want to create a new AI feed? Just refresh the page to start over!
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
