"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Share03Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { copyToClipboardWithMeta } from "@/components/copy-button"
import { Button } from "@workspace/ui/components/button"

function getAppOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export function ShareButton() {
  const searchParams = useSearchParams()
  const [hasCopied, setHasCopied] = React.useState(false)

  const shareUrl = React.useMemo(() => {
    const origin = getAppOrigin()
    const query = searchParams.toString()

    return query ? `${origin}/create?${query}` : `${origin}/create`
  }, [searchParams])

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [hasCopied])

  const handleCopy = React.useCallback(() => {
    copyToClipboardWithMeta(shareUrl, {
      name: "copy_create_share_url",
      properties: {
        url: shareUrl,
      },
    })
    setHasCopied(true)
  }, [shareUrl])

  return (
    <Button variant="outline" className="hidden md:flex" onClick={handleCopy}>
      {hasCopied ? (
        <HugeiconsIcon
          icon={Tick02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
      ) : (
        <HugeiconsIcon
          icon={Share03Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
      )}
      Share
    </Button>
  )
}
