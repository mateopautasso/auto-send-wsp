import * as fs from 'node:fs/promises'

/**
 * Verifica si el archivo existe y retorna el nombre con un sufijo adicional antes de la extensión.
 * @param filename Nombre del archivo original (ej: my_file.xlsx)
 * @param suffix Sufijo a agregar (ej: '_backup')
 * @returns Nuevo nombre de archivo (ej: my_file_backup.xlsx)
 * @throws Error si el archivo no existe
 */
export async function addSuffixToFilenameIfExists(filename: string, suffix: string): Promise<string> {
	try {
		await fs.access(filename)
	} catch {
		throw new Error(`El archivo "${filename}" no existe.`)
	}

	const lastDot = filename.lastIndexOf('.')
	if (lastDot === -1) {
		// No hay extensión
		return filename + suffix
	}
	const name = filename.substring(0, lastDot)
	const ext = filename.substring(lastDot)
	return `${name}${suffix}${ext}`
}
/**
 * Extrae el nombre del archivo de un path dado.
 * @param filePath Ruta completa del archivo
 * @returns Nombre del archivo (ej: archivo.txt)
 */
export function getFilenameFromPath(filePath: string): string {
	const parts = filePath.split(/[\\/]/)
	return parts[parts.length - 1]
}

/**
 * Extrae el path del archivo de un filePath dado.
 * @param filePath Ruta completa del archivo
 * @returns Path del archivo sin el nombre del archivo (ej: /home/user/docs)
 */
export function getPathFromFilePath(filePath: string): string {
	const parts = filePath.split(/[\\/]/)
	parts.pop() // Elimina el nombre del archivo
	return parts.join('/') || '.'
}
