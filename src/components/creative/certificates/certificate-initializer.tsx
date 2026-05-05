"use client";

import React, { useState } from "react";
import { Button } from "@/components/creative/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/creative/ui/card";
import { Alert, AlertDescription } from "@/components/creative/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/creative/ui/dialog";
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface InitializeResult {
  success: boolean;
  action: string;
  organizations?: number;
  templates?: number;
  message: string;
  forceOverride?: boolean;
}

export function CertificateInitializer() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InitializeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async (action: "seed" | "clear" | "reseed") => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/certificates/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to initialize certificate system"
        );
      }

      const data = await response.json();
      setResult({
        success: data.success,
        action: action,
        organizations: data.data?.organizations,
        templates: data.data?.templates,
        message: data.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Certificate System Initialization
        </CardTitle>
        <CardDescription>
          Initialize your certificate system with default templates and
          organizations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Results */}
        {result && (
          <Alert
            className={
              result.success
                ? "border-green-500/20 bg-green-500/10 dark:border-green-400/20 dark:bg-green-400/10"
                : "border-red-500/20 bg-red-500/10 dark:border-red-400/20 dark:bg-red-400/10"
            }
          >
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p
                  className={
                    result.success
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }
                >
                  {result.message}
                </p>
                {result.success &&
                  result.organizations !== undefined &&
                  result.templates !== undefined && (
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p>• Organizations: {result.organizations}</p>
                      <p>• Templates: {result.templates}</p>
                      {result.forceOverride && (
                        <p>• Mode: Force Override (Updated existing entries)</p>
                      )}
                    </div>
                  )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Action - Seed Database */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <Button
              onClick={() => handleInitialize("seed")}
              disabled={loading}
              size="lg"
              className="w-full md:w-auto px-8 py-3 text-lg bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-700 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 dark:border-gray-300 shadow-lg transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Database className="h-5 w-5 mr-3" />
              )}
              Seed Database
            </Button>
            <p className="text-sm text-muted-foreground">
              Initialize your database with all available certificate templates
            </p>
          </div>

          {/* Advanced Options - Collapsible */}
          <details className="border border-border rounded-lg p-4 bg-card">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Advanced Options
            </summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clear Database */}
              <div className="space-y-2">
                <h4 className="font-medium text-red-600 dark:text-red-400">
                  Clear Database
                </h4>
                <p className="text-sm text-muted-foreground">
                  Remove all certificates, templates, and organizations
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Database
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Clear Certificate System</DialogTitle>
                      <DialogDescription>
                        This will permanently delete all default certificate
                        templates and organizations. Issued certificates will
                        not be affected. This cannot be undone. Are you sure?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        className="text-muted-foreground hover:text-foreground border-2 border-border hover:border-primary/50 transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleInitialize("clear")}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive-foreground/20 transition-all duration-200"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Yes, Clear Database
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Reset & Seed */}
              <div className="space-y-2">
                <h4 className="font-medium">Reset & Seed</h4>
                <p className="text-sm text-muted-foreground">
                  Clear everything and start fresh with default templates
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-muted-foreground/30 hover:bg-muted/50 hover:border-primary/50 transition-all duration-200"
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset & Seed
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reset & Seed Certificate System</DialogTitle>
                      <DialogDescription>
                        This will delete all existing data and create fresh
                        default templates and organizations. This cannot be
                        undone. Are you sure?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        className="text-muted-foreground hover:text-foreground border-2 border-border hover:border-primary/50 transition-all duration-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleInitialize("reseed")}
                        disabled={loading}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-white dark:border-gray-300 transition-all duration-200"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Yes, Reset & Seed
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </details>
        </div>

        {/* Information */}
        <div className="mt-6 p-4 bg-muted/30 border border-border rounded-lg">
          <h4 className="font-medium text-foreground mb-2">
            Default Templates Include:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Certificate of Appreciation (FOM)</li>
            <li>• Certificate of Excellence (FOM)</li>
            <li>• Course Completion Certificate</li>
            <li>• Participation Certificate</li>
            <li>• Technology Completion Certificate (EKD Digital)</li>
            <li>• Professional Excellence Award (EKD Digital)</li>
          </ul>
          <div className="mt-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Organizations:</strong>{" "}
              FISHERS OF MEN, EKD Digital, Tech Academy
            </p>
            <p className="mt-1">
              Each template comes with predefined styling, organization
              branding, and customizable fields.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
