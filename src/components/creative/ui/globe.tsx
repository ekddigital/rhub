"use client";
import React, { useEffect, useRef } from "react";

// Types without including Three.js or r3f imports
export type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  globeRadius?: number;
  scale?: number;
  globeImageUrl?: string;
};

export interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

// Export a simple wrapper function that only renders on client
export function World(props: WorldProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { data, globeConfig } = props;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvasEl = canvasRef.current;

    if (!canvasEl) {
      return;
    }

    let cleanupGlobe: (() => void) | undefined;

    // Dynamic import Three.js and related modules only on client
    const initGlobe = async () => {
      try {
        const GlobeModule = await import("./globe-vanilla");
        cleanupGlobe = GlobeModule.createGlobe(canvasEl, {
          globeConfig,
          data,
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to load globe:", error);
      }
    };

    initGlobe();

    return () => {
      if (cleanupGlobe) {
        cleanupGlobe();
      }

      if (canvasEl) {
        canvasEl.innerHTML = "";
      }
    };
  }, [data, globeConfig]);

  return (
    <>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <style jsx>{`
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}
      <div
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "400px",
          position: "relative",
        }}
      />
    </>
  );
}

// Other utility functions that don't depend on Three.js
export function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr;
}
