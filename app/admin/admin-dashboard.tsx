"use client"

import { AdminUser, AdminFeed } from "./types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { toast } from "sonner"

interface AdminDashboardProps {
  initialUsers: AdminUser[]
  initialFeeds: AdminFeed[]
}

export function AdminDashboard({ initialUsers, initialFeeds }: AdminDashboardProps) {
  const [users, setUsers] = useState(initialUsers)
  const [feeds, setFeeds] = useState(initialFeeds)

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
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
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, isActive: user.isActive } : u
        )
      )
      toast.success(`User ${user.isActive ? "enabled" : "disabled"} successfully`)
    } catch (error) {
      console.error("[Admin] Error updating user status:", error)
      toast.error("Failed to update user status")
    }
  }

  const handleToggleFeedStatus = async (feedId: string, currentStatus: boolean) => {
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
      setFeeds(prevFeeds =>
        prevFeeds.map(f =>
          f.id === feedId ? { ...f, isActive: feed.isActive } : f
        )
      )
      toast.success(`Feed ${feed.isActive ? "enabled" : "disabled"} successfully`)
    } catch (error) {
      console.error("[Admin] Error updating feed status:", error)
      toast.error("Failed to update feed status")
    }
  }

  return (
    <main className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="feeds">Shared Feeds</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user._count.generatedImages}</TableCell>
                    <TableCell>{user._count.sharedFeeds}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={user.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      >
                        {user.isActive ? "Disable" : "Enable"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="feeds">
          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeds.map((feed) => (
                  <TableRow key={feed.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{feed.user.name}</div>
                        <div className="text-sm text-gray-500">{feed.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{feed.images.length}</TableCell>
                    <TableCell>{feed.views}</TableCell>
                    <TableCell>
                      <Badge variant={feed.isActive ? "default" : "destructive"}>
                        {feed.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(feed.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/shared/${feed.id}`, '_blank')}
                        >
                          View
                        </Button>
                        <Button
                          variant={feed.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleFeedStatus(feed.id, feed.isActive)}
                        >
                          {feed.isActive ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
