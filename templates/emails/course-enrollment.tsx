import * as React from "react";
import { base, card, h1, palette, small } from "@/templates/emails/_styles";

const LOGO_URL =
	"https://interjudaica.com/_next/image?url=%2Flogo-interjudaica-transparente.png&w=1920&q=75";

export default function CourseEnrollmentEmail({
	firstName,
	courseTitle,
	startDate,
	zoomLink,
}: {
	firstName: string;
	courseTitle: string;
	startDate?: string;
	zoomLink?: string;
}) {
	return (
		<div style={base}>
			<div style={card}>
				<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
					<img src={LOGO_URL} width={56} height={56} alt="InterJudaica"
						style={{ borderRadius: 9999, border: `1px solid ${palette.line}` }} />
					<div>
						<p style={{ margin: 0, color: palette.gold, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", fontSize: 12 }}>
							InterJudaica
						</p>
						<p style={{ ...h1, margin: "6px 0 0" }}>You are enrolled!</p>
					</div>
				</div>
				<div style={{ marginTop: 18, color: palette.muted, fontSize: 14, lineHeight: "22px" }}>
					<p style={{ margin: 0 }}>Hi {firstName},</p>
					<p style={{ margin: "10px 0 0" }}>
						Your enrollment in <strong>{courseTitle}</strong> has been confirmed.
					</p>
					{startDate ? <p style={{ margin: "10px 0 0" }}>Start date: <strong>{startDate}</strong></p> : null}
					{zoomLink ? (
						<p style={{ margin: "10px 0 0" }}>
							Zoom link: <a href={zoomLink} style={{ color: palette.gold }}>{zoomLink}</a>
						</p>
					) : null}
					<p style={{ margin: "10px 0 0" }}>
						Access your classes from the student dashboard at any time.
					</p>
				</div>
				<p style={{ marginTop: 18, ...small }}>If you have questions, reply to this email.</p>
			</div>
		</div>
	);
}
