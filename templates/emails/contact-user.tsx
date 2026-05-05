import * as React from "react";

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
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <h1 style={{ margin: 0 }}>Thank you for contacting InterJudaica</h1>
      <p style={{ marginTop: 16 }}>
        Hi {firstName} {lastName},
      </p>
      <p>
        We received your message and will get back to you as soon as possible.
      </p>
      <hr style={{ margin: "24px 0", border: 0, borderTop: "1px solid #e5e7eb" }} />
      <p style={{ margin: 0, fontWeight: 700 }}>Your message</p>
      <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{message}</p>
      <p style={{ marginTop: 24, color: "#6b7280", fontSize: 12 }}>
        This is an automated confirmation. Please do not share sensitive
        information.
      </p>
    </div>
  );
}
