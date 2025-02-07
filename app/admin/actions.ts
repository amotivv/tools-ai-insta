"use client"

import { toast } from "sonner"

export async function toggleUserStatus(userId: string, currentStatus: boolean) {
  try {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        isActive: !currentStatus,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update user status")
    }

    const { user } = await response.json()
    toast.success(`User ${user.isActive ? "enabled" : "disabled"} successfully`)
    
    // Refresh the page to show updated data
    window.location.reload()
  } catch (error) {
    console.error("[Admin] Error updating user status:", error)
    toast.error("Failed to update user status")
  }
}

export async function toggleFeedStatus(feedId: string, currentStatus: boolean) {
  try {
    const response = await fetch("/api/admin/feeds", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        feedId,
        isActive: !currentStatus,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update feed status")
    }

    const { feed } = await response.json()
    toast.success(`Feed ${feed.isActive ? "enabled" : "disabled"} successfully`)
    
    // Refresh the page to show updated data
    window.location.reload()
  } catch (error) {
    console.error("[Admin] Error updating feed status:", error)
    toast.error("Failed to update feed status")
  }
}

// Add event listeners when the page loads
if (typeof window !== "undefined") {
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement
    
    // Handle user status toggle
    if (target.closest(".toggle-user-status")) {
      const button = target.closest(".toggle-user-status") as HTMLButtonElement
      const userId = button.dataset.userId
      const currentStatus = button.textContent?.trim() === "Disable"
      
      if (userId) {
        toggleUserStatus(userId, currentStatus)
      }
    }
    
    // Handle feed status toggle
    if (target.closest(".toggle-feed-status")) {
      const button = target.closest(".toggle-feed-status") as HTMLButtonElement
      const feedId = button.dataset.feedId
      const currentStatus = button.textContent?.trim() === "Disable"
      
      if (feedId) {
        toggleFeedStatus(feedId, currentStatus)
      }
    }
  })
}
