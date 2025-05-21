import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import xlsx from 'node-xlsx'
import * as dotenv from 'dotenv'
import path from 'path'
import * as fs from 'node:fs/promises'

dotenv.config()

const EXCEL_FILE_NAME = process.env.EXCEL_FILE_NAME || ''
const EXCEL_PATH = path.resolve(`${__dirname}/files`, `${EXCEL_FILE_NAME}.xlsx`)
const MESSAGES = [
	process.env.MESSAGE_1 || '',
	process.env.MESSAGE_2 || '',
	process.env.MESSAGE_3 || '',
	process.env.MESSAGE_4 || '',
	process.env.MESSAGE_5 || '',
]

const SHORT_DELAY = process.env.SHORT_DELAY || '25'
const SHORT_DELAY_RANGE_TO_MS = Number(SHORT_DELAY) * 1000

const LONG_DELAY = process.env.LONG_DELAY || '30'
const LONG_DELAY_TO_MS = Number(LONG_DELAY) * 60 * 1000

const LIMIT_CONSECUTIVE_MESSAGES = process.env.LIMIT_CONSECUTIVE_MESSAGES || '50'
const LIMIT_CONSECUTIVE_MESSAGES_TO_NUMBER = Number(LIMIT_CONSECUTIVE_MESSAGES)

function delay(ms: number) {
	return new Promise((res) => setTimeout(res, ms))
}

function loadPhoneNumbersFromExcel(path: string): string[] {
	const workSheetsFromFile = xlsx.parse(path)
	const numbersArrayFlat = workSheetsFromFile[0].data.flat()
	return numbersArrayFlat.map((number) => String(number))
}

function formatNumberArrayToExcelFormat(numbers: number[] | string[]) {
	return [...numbers.map((number) => [number])]
}

async function sendMessages(client: Client, numbers: string[], messages: string[]) {
	let numbersWithPendingMessages = [...numbers]
	const backupFileName = `${EXCEL_FILE_NAME}_backup.xlsx`
	const backupPath = path.resolve(__dirname, 'files', backupFileName)
	let currentMessage = 0

	try {
		await fs.access(backupPath)
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			const backupFileData = formatNumberArrayToExcelFormat(numbersWithPendingMessages)
			const backupFile = xlsx.build([{ name: backupFileName, data: backupFileData, options: {} }])
			await fs.writeFile(backupPath, backupFile)
		}
	}

	for (let i = 0; i < numbers.length; i++) {
		const formattedNumber = `${numbers[i]}@c.us`

		try {
			await client.sendMessage(formattedNumber, messages[currentMessage])
			console.log(`✅ Mensaje enviado a: ${numbers[i]}`)

			numbersWithPendingMessages = numbersWithPendingMessages.filter((n) => n !== numbers[i])

			await fs.unlink(backupPath)
			const backupFileData = formatNumberArrayToExcelFormat(numbersWithPendingMessages)
			const backupFile = xlsx.build([{ name: backupFileName, data: backupFileData, options: {} }])
			await fs.writeFile(backupPath, backupFile)
		} catch (err) {
			console.error(`❌ Error al enviar a ${numbers[i]}:`, err)
		} finally {
			if (currentMessage < 4) currentMessage = currentMessage + 1
			else currentMessage = 0
		}

		if ((i + 1) % LIMIT_CONSECUTIVE_MESSAGES_TO_NUMBER === 0) {
			console.log(`⏸ Pausa de ${LONG_DELAY} minutos...`)
			await delay(LONG_DELAY_TO_MS)
		} else {
			const minRange = SHORT_DELAY_RANGE_TO_MS - 10000
			const maxRange = SHORT_DELAY_RANGE_TO_MS + 10000
			const randomDelay = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange
			console.log(`⏱ Esperando ${randomDelay / 1000} segundos...`)
			await delay(randomDelay)
		}
	}

	try {
		await fs.access(backupPath)
		const numberInBackupFile = loadPhoneNumbersFromExcel(backupPath)
		if (!numberInBackupFile.length) {
			await fs.unlink(backupPath)
			console.log('🧹 Backup eliminado correctamente.')
		}
	} catch (error) {
		console.error('❌ Error al verificar o eliminar el backup final:', error)
	}
}

async function main() {
	const clientNumbers = loadPhoneNumbersFromExcel(EXCEL_PATH)

	const client = new Client({
		authStrategy: new LocalAuth(),
		puppeteer: {
			headless: true,
			args: ['--no-sandbox'],
		},
	})

	client.on('qr', (qr) => {
		qrcode.generate(qr, { small: true })
		console.log('📱 Escanea el código QR con tu WhatsApp')
	})

	client.on('ready', async () => {
		console.log('✅ Cliente conectado. Iniciando envío de mensajes...')
		await sendMessages(client, clientNumbers, MESSAGES)
		console.log('🏁 Envío completado.')
		process.exit(0)
	})

	client.initialize()
}

main()
