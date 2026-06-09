import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default function CrmIndexPage() {
  redirect('/admin/crm/contacts')
}
