/**
 * لایه ذخیره‌سازی. UI هیچ‌وقت مستقیم با localStorage کار نمی‌کند؛
 * فقط Repository از این درایور استفاده می‌کند تا بعداً جایگزینی با API ممکن باشد.
 */

export interface StorageDriver {
	read<T>(key: string): Promise<T | null>
	write<T>(key: string, value: T): Promise<void>
	remove(key: string): Promise<void>
}

function hasLocalStorage(): boolean {
	try {
		if (typeof window === "undefined" || !window.localStorage) return false
		const probe = "__mcc_probe__"
		window.localStorage.setItem(probe, "1")
		window.localStorage.removeItem(probe)
		return true
	} catch {
		return false
	}
}

export const localStorageDriver: StorageDriver = {
	async read<T>(key: string): Promise<T | null> {
		try {
			const raw = window.localStorage.getItem(key)
			return raw ? (JSON.parse(raw) as T) : null
		} catch {
			return null
		}
	},
	async write<T>(key: string, value: T): Promise<void> {
		try {
			window.localStorage.setItem(key, JSON.stringify(value))
		} catch {
			/* حافظه پر یا حالت خصوصی مرورگر: بی‌صدا رد می‌شود */
		}
	},
	async remove(key: string): Promise<void> {
		try {
			window.localStorage.removeItem(key)
		} catch {
			/* noop */
		}
	},
}

/** جایگزین در حافظه، برای محیطی که localStorage در دسترس نیست */
export function createMemoryStorageDriver(): StorageDriver {
	const map = new Map<string, string>()
	return {
		async read<T>(key: string): Promise<T | null> {
			const raw = map.get(key)
			return raw ? (JSON.parse(raw) as T) : null
		},
		async write<T>(key: string, value: T): Promise<void> {
			map.set(key, JSON.stringify(value))
		},
		async remove(key: string): Promise<void> {
			map.delete(key)
		},
	}
}

export const storageDriver: StorageDriver = hasLocalStorage()
	? localStorageDriver
	: createMemoryStorageDriver()
