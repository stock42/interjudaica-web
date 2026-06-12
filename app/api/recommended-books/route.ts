import { NextResponse } from 'next/server'
import { RecommendedBookStorage } from '@/services/recommended-books-storage'

export const runtime = 'nodejs'

export async function GET() {
	const items = await RecommendedBookStorage.listPublished()
	return NextResponse.json({ items })
}
