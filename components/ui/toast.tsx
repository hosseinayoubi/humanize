"use client"
import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { cn } from "@/lib/utils"

type ToastType = "default" | "success" | "error"
type ToastMessage = { id: string; title?: string; description: string; type: ToastType }

function genId() { return Math.random().toString(16).slice(2) + Date.now().toString(16) }

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const push = React.useCallback((t: Omit<ToastMessage, "id">) => {
    const id = genId()
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200)
  }, [])

  React.useEffect(() => {
    ;(window as any).__toast_push = push
    return () => { ;(window as any).__toast_push = null }
  }, [push])

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          className={cn(
            "pointer-events-auto relative flex w-full items-start justify-between gap-2 overflow-hidden rounded-md border bg-background p-4 shadow-md",
            t.type === "error" && "border-destructive"
          )}
        >
          <div className="grid gap-1">
            {t.title ? <div className="text-sm font-semibold">{t.title}</div> : null}
            <div className="text-sm text-muted-foreground">{t.description}</div>
          </div>
          <button className="rounded-md px-2 text-sm hover:bg-muted" onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} aria-label="Close">✕</button>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  )
}

export const toast = {
  success: (description: string, title?: string) => (window as any).__toast_push?.({ type: "success", description, title }),
  error: (description: string, title?: string) => (window as any).__toast_push?.({ type: "error", description, title }),
  info: (description: string, title?: string) => (window as any).__toast_push?.({ type: "default", description, title })
}
