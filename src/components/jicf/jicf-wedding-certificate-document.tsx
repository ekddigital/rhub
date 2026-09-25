import { JicfCrossSeal } from "@/components/jicf/jicf-cross-seal";
import {
  JICF_WEDDING_COLORS as C,
  buildCertificationText,
  buildOversightText,
  displayPartyName,
  displayWitnessName,
  type JicfWeddingCertificateData,
} from "@/lib/jicf/wedding-certificate-data";

export type JicfWeddingCertificateDocumentProps = {
  data: JicfWeddingCertificateData;
  className?: string;
};

export const JICF_WEDDING_PAGE_WIDTH_MM = 297;
export const JICF_WEDDING_PAGE_HEIGHT_MM = 210;

function SignatureBlock({
  heading,
  name,
  role,
  lineLabel,
}: {
  heading: string;
  name: string;
  role: string;
  lineLabel: string;
}) {
  return (
    <div className="jicf-sig-block">
      {heading ? <p className="jicf-sig-heading">{heading}</p> : null}
      {role ? <p className="jicf-sig-role">{role}</p> : null}
      <p className="jicf-sig-name">{name || "\u00a0"}</p>
      <div className="jicf-sig-line" aria-hidden="true" />
      <p className="jicf-sig-line-label">{lineLabel}</p>
    </div>
  );
}

export function JicfWeddingCertificateDocument({
  data,
  className = "",
}: JicfWeddingCertificateDocumentProps) {
  const certification = buildCertificationText(data);
  const oversight = buildOversightText(data);
  const bride = displayPartyName(data.brideName, "Bride");
  const groom = displayPartyName(data.groomName, "Groom");
  const witness1 = displayWitnessName(data.witness1Name);
  const witness2 = displayWitnessName(data.witness2Name);

  return (
    <article
      className={`jicf-wedding-page ${className}`.trim()}
      aria-label={`${data.title} — ${data.organizationName}`}
    >
      <div className="jicf-wedding-frame jicf-wedding-frame-outer" />
      <div className="jicf-wedding-frame jicf-wedding-frame-gold" />
      <div className="jicf-wedding-frame jicf-wedding-frame-cream" />
      <div className="jicf-wedding-frame jicf-wedding-frame-inner" />

      <span className="jicf-corner jicf-corner-tl" aria-hidden="true" />
      <span className="jicf-corner jicf-corner-tr" aria-hidden="true" />
      <span className="jicf-corner jicf-corner-bl" aria-hidden="true" />
      <span className="jicf-corner jicf-corner-br" aria-hidden="true" />

      <div className="jicf-wedding-inner">
        <header className="jicf-wedding-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/JICF_LOGO1.png"
            alt="JICF"
            className="jicf-wedding-logo"
          />
          <div className="jicf-wedding-header-copy">
            <p className="jicf-org-name">{data.organizationName}</p>
            <p className="jicf-subtitle">{data.subtitle}</p>
          </div>
          <JicfCrossSeal size={68} className="jicf-wedding-seal" />
        </header>

        <div className="jicf-title-block">
          <h1 className="jicf-title">{data.title}</h1>
          <div className="jicf-ornament" aria-hidden="true">
            <span className="jicf-ornament-rule" />
            <span className="jicf-ornament-mark">✦</span>
            <span className="jicf-ornament-rule" />
          </div>
        </div>

        <p className="jicf-cert-lead">{certification}</p>
        <p className="jicf-oversight">{oversight}</p>

        <section className="jicf-parties" aria-label="Bride and groom">
          <div className="jicf-party">
            <p className="jicf-party-label">Bride</p>
            <p className="jicf-party-name">{bride}</p>
          </div>
          <p className="jicf-parties-and" aria-hidden="true">
            &amp;
          </p>
          <div className="jicf-party">
            <p className="jicf-party-label">Groom</p>
            <p className="jicf-party-name">{groom}</p>
          </div>
        </section>

        <p className="jicf-covenant">{data.covenantText}</p>

        <footer className="jicf-wedding-footer">
          <div className="jicf-verify-col">
            <h2 className="jicf-section-title">{data.officiantHeading}</h2>
            <p className="jicf-section-body">{data.officiantTestimony}</p>
            <SignatureBlock
              heading=""
              role={data.officiantRole}
              name={data.officiantName.trim()}
              lineLabel={data.officiantSignatureLabel}
            />
          </div>

          <div className="jicf-verify-col jicf-witness-col">
            <h2 className="jicf-section-title">{data.witnessHeading}</h2>
            <p className="jicf-section-body">{data.witnessTestimony}</p>
            <div className="jicf-witness-grid">
              <SignatureBlock
                heading="Witness 1"
                role=""
                name={witness1}
                lineLabel={data.witnessSignatureLabel}
              />
              <SignatureBlock
                heading="Witness 2"
                role=""
                name={witness2}
                lineLabel={data.witnessSignatureLabel}
              />
            </div>
          </div>
        </footer>

        {data.certificateId.trim() ? (
          <p className="jicf-cert-id">Certificate ID: {data.certificateId}</p>
        ) : null}
      </div>
    </article>
  );
}

export const jicfWeddingCertificateStyles = `
  .jicf-wedding-page {
    --jicf-navy: ${C.navy};
    --jicf-navy-deep: ${C.navyDeep};
    --jicf-red: ${C.red};
    --jicf-gold: ${C.gold};
    --jicf-yellow: ${C.yellow};
    --jicf-cream: ${C.cream};
    --jicf-ivory: ${C.ivory};
    --jicf-ink: ${C.ink};
    --jicf-muted: ${C.muted};
    box-sizing: border-box;
    position: relative;
    width: ${JICF_WEDDING_PAGE_WIDTH_MM}mm;
    height: ${JICF_WEDDING_PAGE_HEIGHT_MM}mm;
    overflow: hidden;
    background: var(--jicf-ivory);
    color: var(--jicf-ink);
    font-family: Georgia, "Times New Roman", Times, serif;
    box-shadow: 0 12px 40px rgba(15, 3, 64, 0.18);
  }

  .jicf-wedding-page *,
  .jicf-wedding-page *::before,
  .jicf-wedding-page *::after {
    box-sizing: border-box;
  }

  .jicf-wedding-frame {
    pointer-events: none;
    position: absolute;
  }

  .jicf-wedding-frame-outer {
    inset: 4mm;
    border: 1.6mm solid var(--jicf-navy);
  }

  .jicf-wedding-frame-gold {
    inset: 6.2mm;
    border: 0.55mm solid var(--jicf-gold);
  }

  .jicf-wedding-frame-cream {
    inset: 7.4mm;
    background: var(--jicf-cream);
  }

  .jicf-wedding-frame-inner {
    inset: 8.8mm;
    border: 0.35mm solid var(--jicf-red);
    background: var(--jicf-ivory);
  }

  .jicf-corner {
    pointer-events: none;
    position: absolute;
    width: 7mm;
    height: 7mm;
    z-index: 2;
    border: 0.45mm solid var(--jicf-gold);
  }

  .jicf-corner-tl { top: 10.4mm; left: 10.4mm; border-right: 0; border-bottom: 0; }
  .jicf-corner-tr { top: 10.4mm; right: 10.4mm; border-left: 0; border-bottom: 0; }
  .jicf-corner-bl { bottom: 10.4mm; left: 10.4mm; border-right: 0; border-top: 0; }
  .jicf-corner-br { bottom: 10.4mm; right: 10.4mm; border-left: 0; border-top: 0; }

  .jicf-wedding-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12mm 16mm 11mm;
  }

  .jicf-wedding-header {
    display: grid;
    grid-template-columns: 18mm 1fr 18mm;
    align-items: center;
    column-gap: 6mm;
    flex: 0 0 auto;
  }

  .jicf-wedding-logo,
  .jicf-wedding-seal {
    width: 17mm;
    height: 17mm;
    object-fit: contain;
    justify-self: center;
  }

  .jicf-wedding-header-copy {
    min-width: 0;
    text-align: center;
  }

  .jicf-org-name {
    margin: 0;
    color: var(--jicf-navy);
    font-size: 5.1mm;
    font-weight: 700;
    letter-spacing: 0.28mm;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .jicf-subtitle {
    margin: 1.2mm 0 0;
    color: var(--jicf-red);
    font-size: 3.3mm;
    font-style: italic;
    font-weight: 600;
    letter-spacing: 0.18mm;
  }

  .jicf-title-block {
    flex: 0 0 auto;
    margin-top: 4.2mm;
    text-align: center;
  }

  .jicf-title {
    margin: 0;
    color: var(--jicf-navy);
    font-size: 8.4mm;
    font-weight: 700;
    letter-spacing: 0.7mm;
    line-height: 1;
    text-transform: uppercase;
  }

  .jicf-ornament {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3mm;
    margin-top: 2.2mm;
  }

  .jicf-ornament-rule {
    display: block;
    width: 28mm;
    height: 0.45mm;
    background: var(--jicf-yellow);
    border-radius: 1mm;
  }

  .jicf-ornament-mark {
    color: var(--jicf-gold);
    font-size: 3.2mm;
    line-height: 1;
  }

  .jicf-cert-lead,
  .jicf-oversight,
  .jicf-covenant {
    margin: 0;
    text-align: center;
    color: var(--jicf-ink);
    line-height: 1.38;
  }

  .jicf-cert-lead {
    margin-top: 4mm;
    font-size: 3.55mm;
  }

  .jicf-oversight {
    margin-top: 2.2mm;
    font-size: 3.25mm;
    color: var(--jicf-muted);
  }

  .jicf-parties {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    column-gap: 5mm;
    margin: 4.2mm 0 0;
    padding: 3.2mm 6mm 3.4mm;
    border-top: 0.35mm solid var(--jicf-gold);
    border-bottom: 0.35mm solid var(--jicf-gold);
    background: linear-gradient(
      180deg,
      rgba(239, 227, 30, 0.12) 0%,
      rgba(255, 253, 231, 0.65) 100%
    );
  }

  .jicf-party {
    min-width: 0;
    text-align: center;
  }

  .jicf-party-label {
    margin: 0 0 1.4mm;
    color: var(--jicf-navy);
    font-size: 2.5mm;
    font-weight: 700;
    letter-spacing: 0.7mm;
    text-transform: uppercase;
  }

  .jicf-party-name {
    margin: 0;
    color: var(--jicf-red);
    font-size: 6.4mm;
    font-style: italic;
    font-weight: 700;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  .jicf-parties-and {
    margin: 0 0 1.2mm;
    color: var(--jicf-gold);
    font-size: 5.5mm;
    font-weight: 700;
    line-height: 1;
  }

  .jicf-covenant {
    margin-top: 3.4mm;
    font-size: 3.15mm;
    font-style: italic;
    color: var(--jicf-muted);
  }

  .jicf-wedding-footer {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr);
    column-gap: 7mm;
    margin-top: 4.2mm;
    min-height: 0;
    flex: 1 1 auto;
  }

  .jicf-section-title {
    margin: 0 0 1.4mm;
    color: var(--jicf-navy);
    font-size: 3.1mm;
    font-weight: 700;
    letter-spacing: 0.28mm;
    text-transform: uppercase;
  }

  .jicf-section-body {
    margin: 0 0 2.4mm;
    color: var(--jicf-ink);
    font-size: 2.7mm;
    line-height: 1.35;
  }

  .jicf-witness-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 5mm;
  }

  .jicf-sig-block {
    min-width: 0;
  }

  .jicf-sig-role,
  .jicf-sig-heading,
  .jicf-sig-line-label {
    margin: 0;
    font-size: 2.35mm;
    letter-spacing: 0.12mm;
  }

  .jicf-sig-role {
    color: var(--jicf-muted);
    font-weight: 700;
  }

  .jicf-sig-name {
    margin: 0.8mm 0 0;
    min-height: 5.2mm;
    color: var(--jicf-navy);
    font-size: 3.4mm;
    font-weight: 700;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }

  .jicf-sig-line {
    margin-top: 6.4mm;
    border-bottom: 0.28mm solid var(--jicf-navy);
  }

  .jicf-sig-line-label {
    margin-top: 1mm;
    color: var(--jicf-muted);
    font-style: italic;
  }

  .jicf-sig-heading {
    margin-top: 0.6mm;
    color: var(--jicf-red);
    font-weight: 700;
  }

  .jicf-cert-id {
    margin: 2.4mm 0 0;
    color: var(--jicf-muted);
    font-size: 2.2mm;
    letter-spacing: 0.16mm;
    text-align: center;
  }
`;
