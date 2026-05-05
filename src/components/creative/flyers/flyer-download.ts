import html2canvas from "html2canvas";

export async function downloadFlyerAsImage(
  elementId: string,
  filename: string = "flyer.png"
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Flyer element not found");
  }

  // Store original styles to restore later
  const originalBorder = element.style.border;
  const originalClassName = element.className;

  try {
    // Temporarily remove interactive styling for clean screenshot
    element.style.border = "none";

    // Wait for images to load
    const images = element.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      })
    );

    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: false,
      imageTimeout: 0,
      ignoreElements: (element) => {
        // Ignore selection highlights, resize handles, and labels
        return (
          element.classList.contains("ring-2") ||
          element.classList.contains("ring-blue-500") ||
          element.classList.contains("cursor-nw-resize") ||
          element.classList.contains("cursor-ne-resize") ||
          element.classList.contains("cursor-sw-resize") ||
          element.classList.contains("cursor-se-resize") ||
          element.tagName === "LABEL"
        );
      },
    });

    // Restore original styles
    element.style.border = originalBorder;
    element.className = originalClassName;

    // Convert to blob and download
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename.endsWith(".png")
            ? filename
            : `${filename}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        } else {
          reject(new Error("Failed to create blob"));
        }
      }, "image/png");
    });
  } catch (error) {
    // Restore original styles on error
    element.style.border = originalBorder;
    element.className = originalClassName;
    console.error("Error downloading flyer:", error);
    throw error;
  }
}

export async function downloadFlyerAsJPG(
  elementId: string,
  filename: string = "flyer.jpg"
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Flyer element not found");
  }

  // Store original styles to restore later
  const originalBorder = element.style.border;
  const originalClassName = element.className;

  try {
    // Temporarily remove interactive styling for clean screenshot
    element.style.border = "none";

    // Wait for images to load
    const images = element.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      })
    );

    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      foreignObjectRendering: false,
      imageTimeout: 0,
      ignoreElements: (element) => {
        // Ignore selection highlights, resize handles, and labels
        return (
          element.classList.contains("ring-2") ||
          element.classList.contains("ring-blue-500") ||
          element.classList.contains("cursor-nw-resize") ||
          element.classList.contains("cursor-ne-resize") ||
          element.classList.contains("cursor-sw-resize") ||
          element.classList.contains("cursor-se-resize") ||
          element.tagName === "LABEL"
        );
      },
    });

    // Restore original styles
    element.style.border = originalBorder;
    element.className = originalClassName;

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download =
              filename.endsWith(".jpg") || filename.endsWith(".jpeg")
                ? filename
                : `${filename}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        "image/jpeg",
        0.95
      );
    });
  } catch (error) {
    // Restore original styles on error
    element.style.border = originalBorder;
    element.className = originalClassName;
    console.error("Error downloading flyer:", error);
    throw error;
  }
}
