import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { BookStorage } from "@/services/books-storage";
import { BookSaleStorage } from "@/services/book-sales-storage";
import { getCurrentUser } from "@/services/user-auth";
import { getStripe } from "@/lib/stripe";
import { readJson } from "@/app/api/_lib/admin-api";

export const runtime = "nodejs";

const schemaBookCheckout = z.object({
	bookUuid: z.string().uuid(),
	firstName: z.string().trim().min(1).optional(),
	lastName: z.string().trim().min(1).optional(),
	email: z.string().email().optional(),
});

function getBaseUrl() {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
	if (siteUrl) return siteUrl;
	return "http://localhost:3025";
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		const payload = schemaBookCheckout.parse(await readJson(request));

		const book = await BookStorage.get(payload.bookUuid);
		if (!book || book.status !== "published") {
			return NextResponse.json(
				{ error: "Book not available" },
				{ status: 404 },
			);
		}

		const firstName = user
			? user.firstName
			: (payload.firstName ?? "");
		const lastName = user
			? user.lastName
			: (payload.lastName ?? "");
		const email = user ? user.email : (payload.email ?? "");

		if (!firstName || !email) {
			return NextResponse.json(
				{ error: "First name and email are required" },
				{ status: 400 },
			);
		}

		const stripe = getStripe();
		const baseUrl = getBaseUrl();
		const amount = Math.round(book.price * 100);
		const accessToken = randomUUID();

		const description = (book.description || "").trim();

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			payment_method_types: ["card"],
			customer_email: email,
			line_items: [
				{
					price_data: {
						currency: "usd",
						product_data: {
							name: book.title,
							...(description ? { description } : {}),
						},
						unit_amount: amount,
					},
					quantity: 1,
				},
			],
			success_url: `${baseUrl}/book/${book.slug}?payment=success`,
			cancel_url: `${baseUrl}/book/${book.slug}?payment=cancelled`,
			metadata: {
				bookUuid: book.uuid ?? "",
				buyerEmail: email,
				buyerFirstName: firstName,
				buyerLastName: lastName,
			},
		});

		await BookSaleStorage.create({
			bookUuid: book.uuid ?? "",
			bookTitle: book.title,
			buyerFirstName: firstName,
			buyerLastName: lastName,
			buyerEmail: email,
			amount: book.price,
			currency: "usd",
			stripeSessionId: session.id,
			accessToken,
		});

		return NextResponse.json({ url: session.url });
	} catch (error) {
		console.error("Book checkout error:", error instanceof Error ? error.message : error);
		return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
	}
}
