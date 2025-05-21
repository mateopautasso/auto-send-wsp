export function delay(ms: number) {
	return new Promise((res) => setTimeout(res, ms))
}

export function getRandomDelay(base: number, range: number = 10000): number {
	const min = base - range
	const max = base + range
	return Math.floor(Math.random() * (max - min + 1)) + min
}
