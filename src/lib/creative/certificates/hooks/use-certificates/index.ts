import { useState, useCallback } from "react";

// Hook for interacting with certificate API endpoints
export function useCertificates() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all certificate templates
  const getTemplates = useCallback(
    async (params?: { isActive?: boolean; category?: string }) => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        if (params?.isActive !== undefined) {
          searchParams.append("isActive", params.isActive.toString());
        }
        if (params?.category) {
          searchParams.append("category", params.category);
        }

        const query = searchParams.toString()
          ? `?${searchParams.toString()}`
          : "";

        const response = await fetch(`/api/certificates/templates${query}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch templates");
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get template by ID
  const getTemplateById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/templates/${id}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch template");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create certificate template
  const createTemplate = useCallback(
    async (templateData: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/certificates/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create template");
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update certificate template
  const updateTemplate = useCallback(
    async (id: string, templateData: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/certificates/templates/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update template");
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete certificate template
  const deleteTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete template");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Issue a certificate
  const issueCertificate = useCallback(
    async (certificateData: Record<string, unknown>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/certificates/issue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(certificateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to issue certificate");
        }

        const data = await response.json();
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Verify a certificate
  const verifyCertificate = useCallback(async (verificationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/certificates/verify/${verificationId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify certificate");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return {
        valid: false,
        message: err instanceof Error ? err.message : "An error occurred",
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user certificates
  const getUserCertificates = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const query = status ? `?status=${status}` : "";
      const response = await fetch(`/api/certificates/user${query}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch certificates");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    issueCertificate,
    verifyCertificate,
    getUserCertificates,
  };
}
