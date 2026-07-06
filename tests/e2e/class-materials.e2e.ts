import {
	expectJsonOk,
	itemFieldFromBody,
	itemUuidFromBody,
	loginAsAdmin,
	registerAndLoginStudent,
} from './class-materials-helpers'
import { expect, test } from '@playwright/test'

test.describe.serial('class material admin and student access', () => {
	test('uploads, edits, downloads, and tracks progress for enrolled students', async ({
		request,
	}) => {
		const adminHeaders = await loginAsAdmin(request)
		const courseResponse = await request.post('/api/admin/courses', {
			headers: adminHeaders,
			data: {
				title: `Materials E2E ${Date.now()}`,
				category: 'Torah',
				price: 19,
				status: 'published',
			},
		})
		const courseBody = await expectJsonOk(courseResponse)
		const courseUuid = itemUuidFromBody(courseBody)

		const classResponse = await request.post('/api/admin/classes', {
			headers: adminHeaders,
			data: {
				courseUuid,
				title: 'Opening sources',
				description: 'Primary reading and notes.',
				order: 0,
			},
		})
		const classBody = await expectJsonOk(classResponse)
		const classUuid = itemUuidFromBody(classBody)

		const uploadResponse = await request.post(`/api/admin/classes/${classUuid}/files`, {
			headers: adminHeaders,
			multipart: {
				title: 'Source packet',
				description: 'Read before class.',
				file: {
					name: 'source-packet.custom',
					mimeType: 'application/x-interjudaica-e2e',
					buffer: Buffer.from('class material body'),
				},
			},
		})
		const uploadBody = await expectJsonOk(uploadResponse)
		const fileUuid = itemUuidFromBody(uploadBody)
		expect(itemFieldFromBody(uploadBody, 'description')).toBe('Read before class.')

		const patchResponse = await request.patch(
			`/api/admin/classes/${classUuid}/files/${fileUuid}`,
			{
				headers: adminHeaders,
				data: {
					title: 'Updated packet',
					description: 'Updated description.',
				},
			},
		)
		const patchBody = await expectJsonOk(patchResponse)
		expect(itemFieldFromBody(patchBody, 'title')).toBe('Updated packet')

		const adminDownload = await request.get(
			`/api/admin/classes/${classUuid}/files/${fileUuid}`,
			{ headers: adminHeaders },
		)
		expect(adminDownload.status()).toBe(200)
		expect(await adminDownload.text()).toBe('class material body')

		const student = await registerAndLoginStudent(request)
		const enrollmentResponse = await request.post('/api/admin/enrollments', {
			headers: adminHeaders,
			data: { userUuid: student.uuid, courseUuid },
		})
		await expectJsonOk(enrollmentResponse)

		const studentDownload = await request.get(`/api/courses/classes/files/${fileUuid}`, {
			headers: student.headers,
		})
		expect(studentDownload.status()).toBe(200)
		expect(await studentDownload.text()).toBe('class material body')

		const progressResponse = await request.patch(
			`/api/courses/classes/${classUuid}/progress`,
			{
				headers: student.headers,
				data: { completed: true },
			},
		)
		const progressBody = await expectJsonOk(progressResponse)
		expect(itemFieldFromBody(progressBody, 'classUuid')).toBe(classUuid)
	})
})
