import path from 'path'
import * as fs from 'node:fs/promises'
import { Client } from 'whatsapp-web.js'
import { delay, getRandomDelay } from './delay'
import { ensureBackup, updateBackup, readBackup } from './excel'
import { LONG_DELAY, SHORT_DELAY, LIMIT_CONSECUTIVE_MESSAGES, EXCEL_FILE_NAME } from '../config/env'
import { Contact } from '../interfaces/contact'

export async function sendMessages(client: Client, contacts: Contact[], messages: string[]) {
	let contactsWithPendingMessages = [...contacts]
	let msgIndex = 0

	const backupPath = path.resolve(__dirname, '../assets/excel/backup', `${EXCEL_FILE_NAME}.xlsx`)
	await ensureBackup(backupPath, contactsWithPendingMessages)

	for (let i = 0; i < contacts.length; i++) {
		const { name, number } = contacts[i]

		const numberFormatted = `${number}@c.us`
		const messageFormatted = name ? `Hola ${name}!\n${messages[msgIndex]}` : `Hola!\n${messages[msgIndex]}`

		try {
			await client.sendMessage(numberFormatted, messageFormatted)
			console.log(`✅ Mensaje enviado a: ${number}`)

			contactsWithPendingMessages = contactsWithPendingMessages.filter((c) => c.number !== number)
			await updateBackup(backupPath, contactsWithPendingMessages)
		} catch (err) {
			console.error(`❌ Error al enviar a ${number}:`, err)
		} finally {
			msgIndex = (msgIndex + 1) % messages.length
		}

		if ((i + 1) % LIMIT_CONSECUTIVE_MESSAGES === 0) {
			console.log(`⏸ Pausa de ${LONG_DELAY / 60000} minutos...`)
			await delay(LONG_DELAY)
		} else {
			const rand = getRandomDelay(SHORT_DELAY)
			console.log(`⏱ Esperando ${rand / 1000} segundos...`)
			await delay(rand)
		}
	}

	try {
		const remaining = readBackup(backupPath)
		if (remaining.length === 0) {
			await fs.unlink(backupPath)
			console.log('🧹 Backup eliminado correctamente.')
		}
	} catch (err) {
		console.error('❌ Error al verificar o eliminar backup final:', err)
	}
}
