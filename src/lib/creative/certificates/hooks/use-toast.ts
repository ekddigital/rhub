"use client";

import { toast } from "sonner";

export function useToast() {
  return {
    toast: (props: {
      title?: string;
      description?: string;
      variant?: "default" | "destructive" | "success";
    }) => {
      const { title, description, variant = "default" } = props;

      const message =
        title && description
          ? `${title}: ${description}`
          : title || description || "";

      if (variant === "destructive") {
        toast.error(message);
      } else if (variant === "success") {
        toast.success(message);
      } else {
        toast(message);
      }
    },
  };
}
