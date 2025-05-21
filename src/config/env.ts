import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

export const EXCEL_FILE_NAME = process.env.EXCEL_FILE_NAME || ''
export const EXCEL_PATH = path.resolve(__dirname, `../assets/excel/${EXCEL_FILE_NAME}.xlsx`)

export const MESSAGES = [
	process.env.MESSAGE_1 || '',
	process.env.MESSAGE_2 || '',
	process.env.MESSAGE_3 || '',
	process.env.MESSAGE_4 || '',
	process.env.MESSAGE_5 || '',
]

export const SHORT_DELAY = Number(process.env.SHORT_DELAY || '25') * 1000
export const LONG_DELAY = Number(process.env.LONG_DELAY || '30') * 60 * 1000
export const LIMIT_CONSECUTIVE_MESSAGES = Number(process.env.LIMIT_CONSECUTIVE_MESSAGES || '50')
