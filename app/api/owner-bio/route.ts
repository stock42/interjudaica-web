import { NextResponse } from 'next/server'

import { OwnerBioStorage } from '@/services/owner-bio-storage'

export const runtime = 'nodejs'

export async function GET() {
	const item = await OwnerBioStorage.getBySlug('ernesto-yattah')
	return NextResponse.json({ item })
}
