import * as React from "react";

import { base, card, h1, palette, small } from "@/templates/emails/_styles";

const LOGO_URL =
	"https://interjudaica.com/_next/image?url=%2Flogo-interjudaica-transparente.png&w=1920&q=75";

export default function ContactReplyEmail({
	firstName,
	lastName,
	replyMessage,
}: {
	firstName: string;
	lastName: string;
	replyMessage: string;
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
							Response to your message
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
					<p style={{ margin: 0 }}>
						Hi {firstName} {lastName},
					</p>
					<p style={{ margin: "10px 0 0" }}>
						Thank you for reaching out. Here is our response:
					</p>
				</div>

				<div
					style={{
						marginTop: 18,
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
					{replyMessage}
				</div>

				<p style={{ marginTop: 18, ...small }}>
					If you have additional questions, reply to this email.
				</p>
			</div>
		</div>
	);
}
