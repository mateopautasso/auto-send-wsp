import qrcode from 'qrcode-terminal'

export function showQRCode(qr: string) {
	qrcode.generate(qr, { small: true })
	console.log('📱 Escanea el código QR con tu WhatsApp')
}
