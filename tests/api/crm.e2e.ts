/**
 * Phase 9 — CRM Endpoint Tests (API-level)
 *
 * Tests all CRM admin endpoints: Contacts, Campaigns, and Tags.
 * Uses admin authentication via the setup helper.
 *
 * Coverage: CRUD, auth (401), validation (400), not-found (404),
 * pagination/filtering/sorting for contacts, campaign-contact relations,
 * export/import for contacts, and createIfNotExists for tags.
 */

import { expect, test } from '@playwright/test'
import { loginAsAdmin, adminAuthHeaders, assertUnauthorized } from './setup'

/* ───────── Shared State ───────── */

let adminHeaders: Record<string, string>

test.beforeAll(async ({ request }) => {
  const cookie = await loginAsAdmin(request)
  adminHeaders = adminAuthHeaders(cookie)
})

/* ──────────────────────────────────────────────────────────── */
/*  CRM Contacts                                                */
/* ──────────────────────────────────────────────────────────── */

test.describe('CRM Contacts — /api/admin/crm/contacts', () => {
  const basePath = '/api/admin/crm/contacts'
  let createdUuid = ''

  test('GET list returns items with pagination', async ({ request }) => {
    const resp = await request.get(`${basePath}?page=1&limit=10`, {
      headers: adminHeaders,
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('items')
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('GET list without auth returns 401', async ({ request }) => {
    const resp = await request.get(basePath)
    await assertUnauthorized(resp)
  })

  test('GET list supports search filtering', async ({ request }) => {
    const resp = await request.get(`${basePath}?q=test`, {
      headers: adminHeaders,
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('GET list supports tag filtering', async ({ request }) => {
    const resp = await request.get(
      `${basePath}?tags=00000000-0000-0000-0000-000000000000`,
      { headers: adminHeaders }
    )
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('GET list supports sorting by firstname', async ({ request }) => {
    const resp = await request.get(`${basePath}?sort=firstname`, {
      headers: adminHeaders,
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('POST creates contact and returns 201', async ({ request }) => {
    const ts = Date.now()
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: {
        email: `crm_contact_${ts}@interjudaica-test.local`,
        firstname: `TestFirst_${ts}`,
        lastname: `TestLast_${ts}`,
      },
    })
    expect(resp.status()).toBe(201)
    const body = await resp.json()
    expect(body).toHaveProperty('item')
    expect(body.item).toHaveProperty('email', `crm_contact_${ts}@interjudaica-test.local`)
    expect(body.item).toHaveProperty('firstname', `TestFirst_${ts}`)
    expect(body.item).toHaveProperty('lastname', `TestLast_${ts}`)
    expect(body.item).toHaveProperty('uuid')
    createdUuid = body.item.uuid
  })

  test('POST creates contact with tags', async ({ request }) => {
    const ts = Date.now()
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: {
        email: `crm_tagged_${ts}@interjudaica-test.local`,
        firstname: `Tagged_${ts}`,
        lastname: 'Contact',
        tags: ['newsletter', 'student'],
      },
    })
    expect(resp.status()).toBe(201)
    const body = await resp.json()
    expect(body.item).toHaveProperty('uuid')
    expect(body.item).toHaveProperty('tags')
  })

  test('POST without auth returns 401', async ({ request }) => {
    const resp = await request.post(basePath, {
      data: { email: 'test@test.com', firstname: 'No', lastname: 'Auth' },
    })
    await assertUnauthorized(resp)
  })

  test('POST with missing email returns 400', async ({ request }) => {
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: { firstname: 'NoEmail', lastname: 'Test' },
    })
    expect(resp.status()).toBe(400)
  })

  test('POST with missing firstname returns 400', async ({ request }) => {
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: { email: 'test@test.com', lastname: 'NoFirst' },
    })
    expect(resp.status()).toBe(400)
  })

  test('POST duplicate email returns 409', async ({ request }) => {
    if (!createdUuid) test.skip(true, 'No contact created for duplicate test')
    const ts = Date.now()
    // Create first contact
    const first = await request.post(basePath, {
      headers: adminHeaders,
      data: {
        email: `crm_dup_${ts}@interjudaica-test.local`,
        firstname: 'Dup',
        lastname: 'First',
      },
    })
    expect(first.status()).toBe(201)
    // Attempt duplicate
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: {
        email: `crm_dup_${ts}@interjudaica-test.local`,
        firstname: 'Dup',
        lastname: 'Second',
      },
    })
    expect(resp.status()).toBe(409)
  })

  test('GET item by UUID returns 200', async ({ request }) => {
    if (!createdUuid) test.skip(true, 'No contact created')
    const resp = await request.get(`${basePath}/${createdUuid}`, {
      headers: adminHeaders,
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('item')
    expect(body.item).toHaveProperty('uuid', createdUuid)
  })

  test('GET item without auth returns 401', async ({ request }) => {
    const resp = await request.get(
      `${basePath}/00000000-0000-0000-0000-000000000000`
    )
    await assertUnauthorized(resp)
  })

  test('GET non-existent UUID returns 404', async ({ request }) => {
    const resp = await request.get(
      `${basePath}/00000000-0000-0000-0000-000000000000`,
      { headers: adminHeaders }
    )
    expect(resp.status()).toBe(404)
  })

  test('PATCH updates contact', async ({ request }) => {
    if (!createdUuid) test.skip(true, 'No contact created')
    const newFirst = `UpdatedFirst_${Date.now()}`
    const resp = await request.patch(`${basePath}/${createdUuid}`, {
      headers: adminHeaders,
      data: { firstname: newFirst, tags: ['updated-tag'] },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.item).toHaveProperty('firstname', newFirst)
  })

  test('PATCH without auth returns 401', async ({ request }) => {
    const resp = await request.patch(
      `${basePath}/00000000-0000-0000-0000-000000000000`,
      { data: { firstname: 'Hack' } }
    )
    await assertUnauthorized(resp)
  })

  test('PATCH non-existent UUID returns 404', async ({ request }) => {
    const resp = await request.patch(
      `${basePath}/00000000-0000-0000-0000-000000000000`,
      {
        headers: adminHeaders,
        data: { firstname: 'Ghost' },
      }
    )
    expect(resp.status()).toBe(404)
  })

  test('DELETE removes contact', async ({ request }) => {
    if (!createdUuid) test.skip(true, 'No contact created')
    const resp = await request.delete(`${basePath}/${createdUuid}`, {
      headers: adminHeaders,
    })
    expect(resp.status()).toBe(200)
    expect(await resp.json()).toEqual({ deleted: true })
  })

  test('DELETE without auth returns 401', async ({ request }) => {
    const resp = await request.delete(
      `${basePath}/00000000-0000-0000-0000-000000000000`
    )
    await assertUnauthorized(resp)
  })

  test('DELETE non-existent UUID returns 404', async ({ request }) => {
    const resp = await request.delete(
      `${basePath}/00000000-0000-0000-0000-000000000000`,
      { headers: adminHeaders }
    )
    expect(resp.status()).toBe(404)
  })

  test('GET export returns CSV', async ({ request }) => {
    const resp = await request.get(`${basePath}/export`, {
      headers: adminHeaders,
    })
    // Export returns 200 with CSV content
    expect(resp.status()).toBe(200)
  })

  test('POST import creates contacts from CSV', async ({ request }) => {
    const ts = Date.now()
    const csvContent = [
      'firstname,lastname,email',
      `ImportA_${ts},One,crm_import_a_${ts}@interjudaica-test.local`,
      `ImportB_${ts},Two,crm_import_b_${ts}@interjudaica-test.local`,
    ].join('\n')
    const resp = await request.post(`${basePath}/import`, {
      headers: { ...adminHeaders },
      multipart: {
        file: {
          name: 'contacts.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent),
        },
      },
    })
    expect(resp.status()).toBe(200)
  })

  test('POST import without auth returns 401', async ({ request }) => {
    const resp = await request.post(`${basePath}/import`, {
      data: { contacts: [] },
    })
    await assertUnauthorized(resp)
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  CRM Campaigns                                               */
/* ──────────────────────────────────────────────────────────── */

test.describe('CRM Campaigns — /api/admin/crm/campaigns', () => {
  const basePath = '/api/admin/crm/campaigns'
  let campaignUuid = ''
  let contactUuid = ''

  test.beforeAll(async ({ request }) => {
    // Create a contact to use for campaign-contact relation tests
    const ts = Date.now()
    const resp = await request.post('/api/admin/crm/contacts', {
      headers: adminHeaders,
      data: {
        email: `crm_campcontact_${ts}@interjudaica-test.local`,
        firstname: `CampContact_${ts}`,
        lastname: 'ForCampaign',
      },
    })
    if (resp.status() === 201) {
      contactUuid = (await resp.json()).item.uuid
    }
  })

  test('GET list returns campaigns', async ({ request }) => {
    const resp = await request.get(basePath, { headers: adminHeaders })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('items')
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('GET list without auth returns 401', async ({ request }) => {
    const resp = await request.get(basePath)
    await assertUnauthorized(resp)
  })

  test('POST creates campaign and returns 201', async ({ request }) => {
    const ts = Date.now()
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: {
        name: `E2E Campaign ${ts}`,
        description: 'A test campaign for e2e testing.',
      },
    })
    expect(resp.status()).toBe(201)
    const body = await resp.json()
    expect(body).toHaveProperty('item')
    expect(body.item).toHaveProperty('name', `E2E Campaign ${ts}`)
    expect(body.item).toHaveProperty('uuid')
    campaignUuid = body.item.uuid
  })

  test('POST creates campaign without description', async ({ request }) => {
    const ts = Date.now()
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: { name: `Minimal Campaign ${ts}` },
    })
    expect(resp.status()).toBe(201)
    const body = await resp.json()
    expect(body.item).toHaveProperty('uuid')
  })

  test('POST without auth returns 401', async ({ request }) => {
    const resp = await request.post(basePath, {
      data: { name: 'Unauth Campaign' },
    })
    await assertUnauthorized(resp)
  })

  test('POST with missing name returns 400', async ({ request }) => {
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: { description: 'No name provided' },
    })
    expect(resp.status()).toBe(400)
  })

  test('GET item by UUID returns 200', async ({ request }) => {
    if (!campaignUuid) test.skip(true, 'No campaign created')
    const resp = await request.get(`${basePath}/${campaignUuid}`, {
      headers: adminHeaders,
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('item')
    expect(body.item).toHaveProperty('uuid', campaignUuid)
  })

  test('GET non-existent UUID returns 404', async ({ request }) => {
    const resp = await request.get(
      `${basePath}/00000000-0000-0000-0000-000000000000`,
      { headers: adminHeaders }
    )
    expect(resp.status()).toBe(404)
  })

  test('PATCH updates campaign', async ({ request }) => {
    if (!campaignUuid) test.skip(true, 'No campaign created')
    const newName = `Updated Campaign ${Date.now()}`
    const resp = await request.patch(`${basePath}/${campaignUuid}`, {
      headers: adminHeaders,
      data: { name: newName, description: 'Updated description.' },
    })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.item).toHaveProperty('name', newName)
  })

  test('PATCH without auth returns 401', async ({ request }) => {
    const resp = await request.patch(
      `${basePath}/00000000-0000-0000-0000-000000000000`,
      { data: { name: 'Hack' } }
    )
    await assertUnauthorized(resp)
  })

  test('DELETE removes campaign', async ({ request }) => {
    if (!campaignUuid) test.skip(true, 'No campaign created')
    const resp = await request.delete(`${basePath}/${campaignUuid}`, {
      headers: adminHeaders,
    })
    expect(resp.status()).toBe(200)
    expect(await resp.json()).toEqual({ deleted: true })
  })

  test('DELETE without auth returns 401', async ({ request }) => {
    const resp = await request.delete(
      `${basePath}/00000000-0000-0000-0000-000000000000`
    )
    await assertUnauthorized(resp)
  })

  test('DELETE non-existent UUID returns 404', async ({ request }) => {
    const resp = await request.delete(
      `${basePath}/00000000-0000-0000-0000-000000000000`,
      { headers: adminHeaders }
    )
    expect(resp.status()).toBe(404)
  })

  // Campaign-contact relations — need a campaign that persists through these tests
  test.describe.serial('Campaign Contacts', () => {
    let relationCampaignUuid = ''

    test.beforeAll(async ({ request }) => {
      const ts = Date.now()
      const resp = await request.post(basePath, {
        headers: adminHeaders,
        data: { name: `Relation Campaign ${ts}` },
      })
      if (resp.status() === 201) {
        relationCampaignUuid = (await resp.json()).item.uuid
      }
    })

    test('GET campaign contacts list returns items', async ({ request }) => {
      if (!relationCampaignUuid) test.skip(true, 'No campaign for relation test')
      const resp = await request.get(
        `${basePath}/${relationCampaignUuid}/contacts`,
        { headers: adminHeaders }
      )
      expect(resp.status()).toBe(200)
      const body = await resp.json()
      expect(Array.isArray(body.items)).toBe(true)
    })

    test('GET campaign contacts without auth returns 401', async ({
      request,
    }) => {
      const resp = await request.get(
        `${basePath}/00000000-0000-0000-0000-000000000000/contacts`
      )
      await assertUnauthorized(resp)
    })

    test('POST add contact to campaign returns 201', async ({ request }) => {
      if (!relationCampaignUuid || !contactUuid)
        test.skip(true, 'Missing campaign or contact')
      const resp = await request.post(
        `${basePath}/${relationCampaignUuid}/contacts`,
        {
          headers: adminHeaders,
          data: { contactUuids: [contactUuid] },
        }
      )
      expect(resp.status()).toBe(201)
    })

    test('POST add contact without auth returns 401', async ({ request }) => {
      const resp = await request.post(
        `${basePath}/00000000-0000-0000-0000-000000000000/contacts`,
        { data: { contactUuids: ['00000000-0000-0000-0000-000000000000'] } }
      )
      await assertUnauthorized(resp)
    })

    test('POST add contact with non-existent UUID works (batch)', async ({ request }) => {
      if (!relationCampaignUuid) test.skip(true, 'No campaign for relation test')
      const resp = await request.post(
        `${basePath}/${relationCampaignUuid}/contacts`,
        {
          headers: adminHeaders,
          data: { contactUuids: ['00000000-0000-0000-0000-000000000000'] },
        }
      )
      expect(resp.status()).toBe(201)
    })

    test('DELETE remove contact from campaign returns 200', async ({
      request,
    }) => {
      if (!relationCampaignUuid || !contactUuid)
        test.skip(true, 'Missing campaign or contact')
      const resp = await request.delete(
        `${basePath}/${relationCampaignUuid}/contacts/${contactUuid}`,
        { headers: adminHeaders }
      )
      expect(resp.status()).toBe(200)
    })

    test('DELETE remove contact without auth returns 401', async ({
      request,
    }) => {
      const resp = await request.delete(
        `${basePath}/00000000-0000-0000-0000-000000000000/contacts/00000000-0000-0000-0000-000000000000`
      )
      await assertUnauthorized(resp)
    })
  })
})

/* ──────────────────────────────────────────────────────────── */
/*  CRM Tags                                                    */
/* ──────────────────────────────────────────────────────────── */

test.describe('CRM Tags — /api/admin/crm/tags', () => {
  const basePath = '/api/admin/crm/tags'

  test('GET list returns tags', async ({ request }) => {
    const resp = await request.get(basePath, { headers: adminHeaders })
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toHaveProperty('items')
    expect(Array.isArray(body.items)).toBe(true)
  })

  test('GET list without auth returns 401', async ({ request }) => {
    const resp = await request.get(basePath)
    await assertUnauthorized(resp)
  })

  test('POST creates tag and returns 201', async ({ request }) => {
    const ts = Date.now()
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: { name: `e2e-tag-${ts}` },
    })
    expect(resp.status()).toBe(201)
    const body = await resp.json()
    expect(body).toHaveProperty('item')
    expect(body.item).toHaveProperty('name', `e2e-tag-${ts}`)
    expect(body.item).toHaveProperty('uuid')
  })

  test('POST createIfNotExists — returns existing tag instead of 409', async ({
    request,
  }) => {
    const ts = Date.now()
    const tagName = `idempotent-tag-${ts}`
    // First creation
    const first = await request.post(basePath, {
      headers: adminHeaders,
      data: { name: tagName },
    })
    expect(first.status()).toBe(201)
    const firstUuid = (await first.json()).item.uuid

    // Second creation with same name should return existing (200, not 409)
    const second = await request.post(basePath, {
      headers: adminHeaders,
      data: { name: tagName },
    })
    expect(second.status()).toBe(200)
    const secondBody = await second.json()
    expect(secondBody.item).toHaveProperty('uuid', firstUuid)
  })

  test('POST without auth returns 401', async ({ request }) => {
    const resp = await request.post(basePath, {
      data: { name: 'unauth-tag' },
    })
    await assertUnauthorized(resp)
  })

  test('POST with missing name returns 400', async ({ request }) => {
    const resp = await request.post(basePath, {
      headers: adminHeaders,
      data: {},
    })
    expect(resp.status()).toBe(400)
  })
})
