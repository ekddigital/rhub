import { cn } from "@/lib/utils";

interface ThemedCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ThemedCard({ children, className }: ThemedCardProps) {
  return (
    <div className={cn("bg-white dark:bg-zinc-900 rounded-lg p-6", className)}>
      {children}
    </div>
  );
}
