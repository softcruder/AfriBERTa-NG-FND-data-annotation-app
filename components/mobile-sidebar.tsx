"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SidebarLinks } from "./dashboard-sidebar"
import { Menu } from "lucide-react"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu" className="hover:bg-accent/50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="h-full w-full overflow-y-auto">
            <div className="px-4 py-6 border-b border-border/50">
              <div className="text-sm font-semibold tracking-wide text-foreground">AfriBERTa NG</div>
              <div className="text-xs text-muted-foreground mt-0.5">Data Annotation Platform</div>
            </div>
            <div className="p-4">
              <SidebarLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default MobileSidebar
