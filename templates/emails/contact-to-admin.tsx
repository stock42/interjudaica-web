import * as React from "react";

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
    <div style={{ fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <h1 style={{ margin: 0 }}>New contact message</h1>
      <p style={{ marginTop: 16 }}>
        <strong>From:</strong> {firstName} {lastName}
        <br />
        <strong>Email:</strong> {email}
      </p>
      <hr style={{ margin: "24px 0", border: 0, borderTop: "1px solid #e5e7eb" }} />
      <p style={{ margin: 0, fontWeight: 700 }}>Message</p>
      <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{message}</p>
    </div>
  );
}
