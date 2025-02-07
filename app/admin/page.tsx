import { auth } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
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

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/auth/signin")
  }

  // Check if user has admin scope
  const account = await prisma.account.findFirst({
    where: {
      user: {
        email: session.user.email
      },
      scope: {
        contains: "admin"
      }
    }
  })

  if (!account) {
    redirect("/")
  }

  // Fetch initial data
  const [users, feeds] = await Promise.all([
    prisma.user.findMany({
      include: {
        accounts: {
          select: {
            provider: true,
            scope: true
          }
        },
        _count: {
          select: {
            generatedImages: true,
            sharedFeeds: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    }),
    prisma.sharedFeed.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isActive: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
  ])

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
                {users.map((user: AdminUser) => (
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
                        data-user-id={user.id}
                        className="toggle-user-status"
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
                {feeds.map((feed: AdminFeed) => (
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
                          data-feed-id={feed.id}
                          className="toggle-feed-status"
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
