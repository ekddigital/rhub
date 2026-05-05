"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#C8A061] text-white hover:bg-[#C8A061]/90 dark:bg-[#D4AF6A] dark:text-[#1F1C18] dark:hover:bg-[#D4AF6A]/90",
        destructive:
          "bg-[#8E0E00] text-white hover:bg-[#8E0E00]/90 dark:bg-[#8E0E00] dark:text-white dark:hover:bg-[#8E0E00]/90",
        outline:
          "border-2 border-[#C8A061] bg-transparent text-[#1A1A1A] hover:bg-[#C8A061]/10 dark:border-[#D4AF6A] dark:text-[#E6E6E6] dark:hover:bg-[#D4AF6A]/10",
        secondary:
          "bg-[#1F1C18]/10 text-[#1A1A1A] hover:bg-[#1F1C18]/20 dark:bg-[#E6E6E6]/10 dark:text-[#E6E6E6] dark:hover:bg-[#E6E6E6]/20",
        ghost:
          "hover:bg-[#C8A061]/10 hover:text-[#1A1A1A] dark:hover:bg-[#D4AF6A]/10 dark:hover:text-[#E6E6E6]",
        link: "text-[#C8A061] underline-offset-4 hover:underline dark:text-[#D4AF6A]",
        accent:
          "bg-[#182e5f] text-white hover:bg-[#182e5f]/90 dark:bg-[#182e5f] dark:text-white dark:hover:bg-[#182e5f]/90",
        primary:
          "bg-[#C8A061] text-white hover:bg-[#C8A061]/90 dark:bg-[#D4AF6A] dark:text-[#1F1C18] dark:hover:bg-[#D4AF6A]/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
