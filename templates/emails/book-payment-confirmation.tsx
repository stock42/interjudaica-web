import * as React from "react";

import { base, card, h1, palette, small } from "@/templates/emails/_styles";

const LOGO_URL =
	"https://interjudaica.com/_next/image?url=%2Flogo-interjudaica-transparente.png&w=1920&q=75";

export default function BookPaymentConfirmationEmail({
	firstName,
	bookTitle,
	priceLabel,
	downloadUrl,
}: {
	firstName: string;
	bookTitle: string;
	priceLabel: string;
	downloadUrl?: string;
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
							Thank you for your purchase
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
						We received your payment for <strong>{bookTitle}</strong>.
					</p>
					<p style={{ margin: "10px 0 0" }}>
						Amount: <strong>{priceLabel}</strong>
					</p>
					{downloadUrl ? (
						<div style={{ margin: "14px 0 0" }}>
							<a
								href={downloadUrl}
								style={{
									display: "inline-block",
									padding: "10px 22px",
									backgroundColor: palette.gold,
									color: "#050608",
									fontWeight: 700,
									borderRadius: 8,
									textDecoration: "none",
									fontSize: 14,
								}}
							>
								Download your book
							</a>
							<p style={{ margin: "8px 0 0", ...small }}>
								Or copy this link: {downloadUrl}
							</p>
						</div>
					) : (
						<p style={{ margin: "10px 0 0" }}>
							Your download will be available in your dashboard.
						</p>
					)}
				</div>

				<p style={{ marginTop: 18, ...small }}>
					If you have questions, reply to this email.
				</p>
			</div>
		</div>
	);
}
