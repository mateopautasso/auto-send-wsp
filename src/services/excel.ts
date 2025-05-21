import xlsx from 'node-xlsx'
import * as fs from 'node:fs/promises'
import { Contact } from '../interfaces/contact'

export function getContactsDataFromExcelFile(excelPath: string): Contact[] {
	const workSheets = xlsx.parse(excelPath)
	const data = workSheets[0].data.map((row) => {
		return { number: row[0], name: row[1] }
	})
	return data
}

export function formatToExcel<T>(numbers: T[]): any[][] {
	return numbers.map((n) => [n])
}

export async function createBackup<T>(filePath: string, data: T[]) {
	const formatted = formatToExcel(data)
	const content = xlsx.build([{ name: 'Backup', data: formatted, options: {} }])
	await fs.writeFile(filePath, content)
}

export async function ensureBackup<T>(filePath: string, data: T[]) {
	try {
		await fs.access(filePath)
	} catch (err: any) {
		if (err.code === 'ENOENT') await createBackup(filePath, data)
	}
}

export async function updateBackup<T>(filePath: string, data: T[]) {
	const formatted = formatToExcel(data)
	const content = xlsx.build([{ name: 'Backup', data: formatted, options: {} }])
	await fs.unlink(filePath)
	await fs.writeFile(filePath, content)
}

export function readBackup(path: string): string[] {
	const workSheets = xlsx.parse(path)
	return workSheets[0].data.flat().map((n) => String(n))
}
