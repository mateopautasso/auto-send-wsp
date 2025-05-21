import { Client, LocalAuth } from 'whatsapp-web.js'
import { getContactsDataFromExcelFile } from './services/excel'
import { sendMessages } from './services/whatsapp'
import { showQRCode } from './utils/logger'
import { EXCEL_PATH, MESSAGES } from './config/env'

export async function main() {
	const wspClient = new Client({
		authStrategy: new LocalAuth(),
		puppeteer: {
			headless: true,
			args: ['--no-sandbox'],
		},
	})

	wspClient.on('qr', showQRCode)

	wspClient.on('ready', async () => {
		console.log('✅ Cliente conectado. Iniciando envío de mensajes...')
		const dataContacts = getContactsDataFromExcelFile(EXCEL_PATH)
		await sendMessages(wspClient, dataContacts, MESSAGES)
		console.log('🏁 Envío completado.')
		process.exit(0)
	})

	wspClient.initialize()
}
