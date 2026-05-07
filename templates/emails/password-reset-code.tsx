import * as React from "react";

import { base, card, h1, palette, small } from "@/templates/emails/_styles";

const LOGO_URL =
	"https://interjudaica.com/_next/image?url=%2Flogo-interjudaica-transparente.png&w=1920&q=75";

export default function PasswordResetCodeEmail({
	firstName,
	code,
}: {
	firstName: string;
	code: string;
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
						<p style={{ ...h1, margin: "6px 0 0" }}>
							Password reset code
						</p>
					</div>
				</div>

				<div
					style={{
						marginTop: 18,
						color: palette.muted,
						fontSize: 14,
						lineHeight: "22px",
					}}
				>
					<p style={{ margin: 0 }}>Hi {firstName},</p>
					<p style={{ margin: "10px 0 0" }}>
						Use the code below to reset your InterJudaica password. This code
						expires in 15 minutes.
					</p>
				</div>

				<div
					style={{
						marginTop: 18,
						border: `1px solid ${palette.line}`,
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
						fontSize: 28,
						letterSpacing: "0.35em",
						fontWeight: 700,
						color: palette.text,
						backgroundColor: "rgba(0,0,0,0.28)",
					}}
				>
					{code}
				</div>

				<p style={{ marginTop: 18, ...small }}>
					If you did not request this, you can ignore the email.
				</p>
			</div>
		</div>
	);
}
