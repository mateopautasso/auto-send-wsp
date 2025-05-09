import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import * as XLSX from 'xlsx'
import xlsx from 'node-xlsx'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const MESSAGE = process.env.MESSAGE || ''
const EXCEL_FILE_NAME = process.env.EXCEL_FILE_NAME || ''
const EXCEL_PATH = path.resolve(__dirname, `${EXCEL_FILE_NAME}.xlsx`)

function delay(ms: number) {
	return new Promise((res) => setTimeout(res, ms))
}

function readNumbersFromExcel(): string[] {
	const workSheetsFromFile = xlsx.parse(`${__dirname}/${EXCEL_FILE_NAME}.xlsx`)
	const numbersArray = workSheetsFromFile[0].data.flat()
	// const workbook = XLSX.readFile(EXCEL_PATH)
	// const sheet = workbook.Sheets[workbook.SheetNames[0]]
	// const data = XLSX.utils.sheet_to_json<{ numbers: string }>(sheet)
	return numbersArray.map((number) => String(number))
}

async function sendMessages(client: Client, numeros: string[], mensaje: string) {
	for (let i = 0; i < numeros.length; i++) {
		const numeroFormateado = `${numeros[i]}@c.us`

		try {
			await client.sendMessage(numeroFormateado, mensaje)
			console.log(`✅ Mensaje enviado a: ${numeros[i]}`)
		} catch (err) {
			console.error(`❌ Error al enviar a ${numeros[i]}:`, err)
		}

		if ((i + 1) % 50 === 0) {
			console.log('⏸ Pausa de 30 minutos...')
			await delay(30 * 60 * 1000)
		} else {
			const randomDelay = Math.floor(Math.random() * (35000 - 15000 + 1)) + 15000
			console.log(`⏱ Esperando ${randomDelay / 1000} segundos...`)
			await delay(randomDelay)
		}
	}
}

async function main() {
	const numbers = readNumbersFromExcel()

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
		await sendMessages(client, numbers, MESSAGE)
		console.log('🏁 Envío completado.')
		process.exit(0)
	})

	client.initialize()
}

main()
