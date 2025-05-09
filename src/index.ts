import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import xlsx from 'node-xlsx'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const EXCEL_FILE_NAME = process.env.EXCEL_FILE_NAME || ''
const EXCEL_PATH = path.resolve(`${__dirname}/files/excel`, `${EXCEL_FILE_NAME}.xlsx`)
const MESSAGE = process.env.MESSAGE || ''

const SHORT_DELAY = process.env.SHORT_DELAY || '25'
const SHORT_DELAY_RANGE_TO_MS = Number(SHORT_DELAY) * 1000

const LONG_DELAY = process.env.LONG_DELAY || '30'
const LONG_DELAY_TO_MS = Number(LONG_DELAY) * 60 * 1000

function delay(ms: number) {
	return new Promise((res) => setTimeout(res, ms))
}

function readNumbersFromExcel(): string[] {
	const workSheetsFromFile = xlsx.parse(EXCEL_PATH)
	const numbersArray = workSheetsFromFile[0].data.flat()
	return numbersArray.map((number) => String(number))
}

async function sendMessages(client: Client, numbers: string[], message: string) {
	for (let i = 0; i < numbers.length; i++) {
		const formattedNumber = `${numbers[i]}@c.us`

		try {
			await client.sendMessage(formattedNumber, message)
			console.log(`✅ Mensaje enviado a: ${numbers[i]}`)
		} catch (err) {
			console.error(`❌ Error al enviar a ${numbers[i]}:`, err)
		}

		if ((i + 1) % 50 === 0) {
			console.log(`⏸ Pausa de ${LONG_DELAY} minutos...`)
			await delay(LONG_DELAY_TO_MS)
		} else {
			const minRange = SHORT_DELAY_RANGE_TO_MS - 10000
			const maxRange = SHORT_DELAY_RANGE_TO_MS + 10000
			const randomDelay = Math.floor(Math.random() * (minRange - maxRange + 1)) + minRange
			console.log(`⏱ Esperando ${randomDelay / 1000} segundos...`)
			await delay(randomDelay)
		}
	}
}

async function main() {
	const clientNumbers = readNumbersFromExcel()

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
		await sendMessages(client, clientNumbers, MESSAGE)
		console.log('🏁 Envío completado.')
		process.exit(0)
	})

	client.initialize()
}

main()
