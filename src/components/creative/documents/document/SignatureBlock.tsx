"use client";

/**
 * Signature Block Component
 * Renders the signatory section at the end of a formal document.
 * Matches the EKD Digital letterhead template signature format.
 * Supports optional signature image (uploaded via AssetBrowser).
 */

import React from "react";
import { LETTERHEAD, TYPOGRAPHY } from "@/lib/creative/documents/constants";

interface SignatureBlockProps {
  name: string;
  title: string;
  company: string;
  date?: string;
  /** URL of uploaded signature image */
  signatureImage?: string;
  /** Authorization text */
  authorizationText?: string;
}

export function SignatureBlock({
  name,
  title,
  company,
  date,
  signatureImage,
  authorizationText = "Duly authorized to sign this bid on behalf of",
}: SignatureBlockProps) {
  return (
    <div
      className="document-signature-block"
      style={{
        marginTop: "32px",
        paddingTop: "16px",
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontSize: TYPOGRAPHY.body.fontSize,
        lineHeight: 1.8,
        color: "#1F1C18",
      }}
    >
      {/* Signature image or underline */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontWeight: 600 }}>Signed:</span>
        {signatureImage ? (
          <div style={{ position: "relative", width: 140, height: 52 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureImage}
              alt={`${name}'s signature`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              width: 160,
              borderBottom: `1.5px solid ${LETTERHEAD.goldColor}`,
              marginBottom: "2px",
            }}
          />
        )}
      </div>

      {/* Name and title */}
      <p style={{ margin: "3px 0" }}>
        <strong>Name:</strong> {name}
      </p>
      <p style={{ margin: "3px 0" }}>
        <strong>Title:</strong> {title}
      </p>

      {/* Authorization text */}
      <p
        style={{
          margin: "10px 0 3px 0",
          fontStyle: "italic",
          fontSize: "10px",
          color: "#555",
        }}
      >
        {authorizationText}
      </p>
      <p
        style={{
          margin: "2px 0",
          fontWeight: 600,
          color: LETTERHEAD.goldColor,
        }}
      >
        {company}
      </p>

      {/* Date */}
      {date && (
        <p style={{ margin: "10px 0 0 0" }}>
          <strong>Date:</strong> {date}
        </p>
      )}
    </div>
  );
}
