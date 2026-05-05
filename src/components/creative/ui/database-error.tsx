import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface DatabaseErrorDetail {
  code?: string;
  message?: string;
  stack?: string;
  [key: string]: unknown;
}

interface DatabaseErrorProps {
  title?: string;
  message?: string;
  error?: DatabaseErrorDetail | null;
  className?: string;
  backHref?: string;
  onRetry?: () => void;
}

export function DatabaseError({
  title = "Database Connection Error",
  message = "We're having trouble connecting to the database. Please try again later.",
  error,
  className,
  backHref,
  onRetry,
}: DatabaseErrorProps) {
  // Log the actual error to console for debugging
  if (error) console.error("[DatabaseError]", error);

  const isConnectionError = error?.code === "P1001";
  const errorMessage = isConnectionError
    ? "Cannot connect to the database server. This might be a temporary issue."
    : message;

  return (
    <div className={cn("w-full p-6", className)}>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-400">
            {title}
          </h2>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">{errorMessage}</p>

        {isConnectionError && (
          <ul className="list-disc pl-5 mb-4 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Temporary connectivity issues</li>
            <li>Database server maintenance</li>
            <li>Network configuration problems</li>
          </ul>
        )}

        <div className="flex gap-4 mt-6">
          <Button
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            variant="default"
          >
            Try Again
          </Button>

          {backHref && (
            <Button
              variant="outline"
              onClick={() => (window.location.href = backHref)}
            >
              Go Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
