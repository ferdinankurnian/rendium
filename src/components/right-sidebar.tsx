import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Spinner } from "@/components/ui/spinner"

export function RightSidebar() {
  const user = useQuery(api.users.viewer)
  const bookmarkCount = useQuery(api.bookmarks.count)

  return (
    <div className="hidden xl:block">
      <div className="fixed right-4 top-4 bottom-4 w-80 flex flex-col gap-4">
        {/* User Profile Card */}
        <Card className="p-0">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20">
                <img 
                  src={user?.image} 
                  alt={user?.name} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-none">{user?.name}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium flex items-center gap-1">
                  {bookmarkCount === undefined ? (
                    <Spinner className="size-3" />
                  ) : (
                    bookmarkCount
                  )}
                  <span className="text-muted-foreground font-normal">/ ∞ bookmarks</span>
                </span>
                <span className="text-muted-foreground">∞ %</span>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
