import { NextResponse, type NextRequest } from "next/server";
import { BookSaleStorage } from "@/services/book-sales-storage";
import { BookStorage } from "@/services/books-storage";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function GET(
	request: NextRequest,
) {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return NextResponse.json({ error: "Missing token" }, { status: 400 });
	}

	const sale = await BookSaleStorage.getByAccessToken(token);
	if (!sale || sale.status !== "paid") {
		return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
	}

	const book = await BookStorage.get(sale.bookUuid);
	if (!book || !book.filePath) {
		return NextResponse.json({ error: "Book file not available" }, { status: 404 });
	}

	const filePath = path.join(process.cwd(), "public", book.filePath.replace(/^\//, ""));

	try {
		const buffer = await readFile(filePath);
		const fileName = `${book.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

		return new NextResponse(buffer, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="${fileName}"`,
				"Content-Length": String(buffer.length),
			},
		});
	} catch {
		return NextResponse.json({ error: "File not found" }, { status: 404 });
	}
}
