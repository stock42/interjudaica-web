import * as React from "react";

import { base, card, h1, palette, small } from "@/templates/emails/_styles";

const LOGO_URL =
  "https://interjudaica.com/_next/image?url=%2Flogo-interjudaica-transparente.png&w=1920&q=75";

const ERNESTO_URL =
  "https://interjudaica.com/_next/image?url=%2Ffoto-ernesto-yattah-bg-transparent.png&w=1920&q=75";

export default function ContactToAdminEmail({
  email,
  firstName,
  lastName,
  message,
}: {
  email: string;
  firstName: string;
  lastName: string;
  message: string;
}) {
  return (
    <div style={base}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img
            src={LOGO_URL}
            width={56}
            height={56}
            alt="InterJudaica"
            style={{
              borderRadius: 9999,
              border: `1px solid ${palette.line}`,
            }}
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
            <p style={{ ...h1, margin: "6px 0 0" }}>New contact message</p>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 14,
            alignItems: "center",
            border: `1px solid ${palette.line}`,
            borderRadius: 12,
            padding: 14,
            backgroundColor: "rgba(0,0,0,0.28)",
          }}
        >
          <img
            src={ERNESTO_URL}
            width={96}
            height={96}
            alt="Ernesto Yattah"
            style={{
              borderRadius: 14,
              border: `1px solid ${palette.line}`,
              backgroundColor: "rgba(0,0,0,0.18)",
            }}
          />
          <div style={{ color: palette.text }}>
            <p style={{ margin: 0, color: palette.gold, fontWeight: 800 }}>
              Ernesto Yattah
            </p>
            <p
              style={{
                margin: "6px 0 0",
                color: palette.muted,
                fontSize: 14,
                lineHeight: "22px",
              }}
            >
              Teacher, guide, and passionate advocate for serious Jewish
              learning. Ernesto Yattah brings years of study and teaching
              experience into a clear, warm, and rigorous learning environment.
            </p>
            <p
              style={{
                margin: "10px 0 0",
                color: palette.muted,
                fontSize: 13,
                lineHeight: "20px",
              }}
            >
              Ernesto Yattah and his team will respond to this message as soon as
              possible.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            border: `1px solid ${palette.line}`,
            borderRadius: 12,
            padding: 14,
            backgroundColor: "rgba(0,0,0,0.28)",
            color: palette.text,
            fontSize: 14,
            lineHeight: "22px",
          }}
        >
          <p style={{ margin: 0 }}>
            <span style={{ color: palette.gold, fontWeight: 800 }}>From:</span>{" "}
            {firstName} {lastName}
          </p>
          <p style={{ margin: "8px 0 0" }}>
            <span style={{ color: palette.gold, fontWeight: 800 }}>Email:</span>{" "}
            {email}
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
            Message
          </p>
          <div
            style={{
              marginTop: 10,
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
          Reply directly to this email to respond to the user.
        </p>
      </div>
    </div>
  );
}
