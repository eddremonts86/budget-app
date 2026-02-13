"use client"

import { Toggle as TogglePrimitive } from "radix-ui"
import * as React from "react"
import { toggleVariants, type ToggleVariantProps } from "@/components/ui/toggle-variants"
import { cn } from "@/shared/utils/index"

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & ToggleVariantProps) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle }
