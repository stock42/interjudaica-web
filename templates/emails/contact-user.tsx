import * as React from "react";

import { base, card, h1, palette, small } from "@/templates/emails/_styles";

export default function ContactUserEmail({
  firstName,
  lastName,
  message,
}: {
  firstName: string;
  lastName: string;
  message: string;
}) {
  return (
    <div style={base}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src="https://interjudaica.com/_next/image?url=%2Flogo-interjudaica-transparente.png&w=1920&q=75"
            width={56}
            height={56}
            alt="InterJudaica"
            style={{ borderRadius: 9999, border: `1px solid ${palette.line}` }}
          />
          <div>
            <p
              style={{
                margin: 0,
                color: palette.gold,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              InterJudaica
            </p>
            <p style={{ ...h1, margin: "6px 0 0" }}>
              Thank you for contacting us
            </p>
          </div>
        </div>

        <div style={{ marginTop: 18, color: palette.muted, fontSize: 14, lineHeight: "22px" }}>
          <p style={{ margin: 0 }}>
            Hi {firstName} {lastName},
          </p>
          <p style={{ margin: "10px 0 0" }}>
            We received your message and will get back to you as soon as possible.
          </p>
        </div>

        <div
          style={{
            marginTop: 18,
            borderTop: `1px solid ${palette.line}`,
            paddingTop: 16,
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              color: palette.gold,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            Your message
          </p>
          <div
            style={{
              marginTop: 10,
              backgroundColor: "rgba(0,0,0,0.28)",
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              padding: 14,
              whiteSpace: "pre-wrap",
              color: palette.text,
              fontSize: 14,
              lineHeight: "22px",
            }}
          >
            {message}
          </div>
        </div>

        <p style={{ marginTop: 18, ...small }}>
          This is an automated confirmation. Please do not include sensitive
          personal information.
        </p>
      </div>
    </div>
  );
}
