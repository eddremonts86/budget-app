import { Slot } from "radix-ui"
import * as React from "react"
import { cn } from "@/shared/utils/index"
import { buttonVariants, type ButtonVariantProps } from "./button-variants"

interface ButtonProps extends React.ComponentProps<"button">, ButtonVariantProps {
  asChild?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
