import { SignatoryDraft } from "@/components/tools/conf/document-signatory-controls";
import {
  signatureBlockContainerStyle,
  signatureBlockItemStyle,
} from "@/lib/conf/letter-signatories";

type Props = {
  draft: SignatoryDraft;
  compact?: boolean;
};

export function DocumentSignatureBlock({ draft, compact = false }: Props) {
  if (draft.signatoryMode === "NONE") return null;

  const signatories = [draft.signatory1, draft.signatory2, draft.signatory3].filter(
    (slot) => slot.name.trim() || slot.title.trim(),
  );

  if (signatories.length === 0) return null;

  return (
    <div
      style={{
        marginTop: compact ? 20 : 28,
        paddingTop: 14,
        borderTop: "1px solid #C8A061",
        ...signatureBlockContainerStyle(),
      }}
    >
      {signatories.map((slot, idx) => (
        <div key={`${slot.name}-${idx}`} style={signatureBlockItemStyle()}>
          {slot.sig && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 2,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.sig}
                alt="signature"
                style={{
                  height: Math.round(36 * (slot.sigScale || 1)),
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          )}
          <div
            style={{
              borderTop: "1px solid #222",
              width: "100%",
              marginBottom: 4,
            }}
          />
          {slot.label && (
            <div
              style={{
                fontSize: 9,
                color: "#777",
                marginBottom: 4,
                fontStyle: "italic",
              }}
            >
              {slot.label}
            </div>
          )}
          {slot.name && (
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#222",
              }}
            >
              {slot.name}
            </div>
          )}
          {slot.title && <div style={{ fontSize: 10.5, color: "#777" }}>{slot.title}</div>}
        </div>
      ))}
    </div>
  );
}
