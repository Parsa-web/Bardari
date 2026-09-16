/** شناسه یکتای محلی. در نسخه واقعی، شناسه از سمت سرور می‌آید. */
export function uid(prefix: string): string {
	const random = Math.random().toString(36).slice(2, 8)
	return `${prefix}_${Date.now().toString(36)}${random}`
}
