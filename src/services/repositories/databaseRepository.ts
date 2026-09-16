import type { AppDatabase } from "../../shared/types/domain"
import type { StorageDriver } from "../storage/storage"
import { storageDriver } from "../storage/storage"
import { createSeedDatabase, SCHEMA_VERSION } from "../mock/seed"

/** قرارداد Repository — async است تا بعداً بتوان پیاده‌سازی API واقعی را جایگزین کرد. */
export interface DatabaseRepository {
	load(): Promise<AppDatabase>
	save(db: AppDatabase): Promise<void>
	reset(): Promise<AppDatabase>
}

export const DB_STORAGE_KEY = "mcc.db.v1"

export class LocalDatabaseRepository implements DatabaseRepository {
	constructor(
		private readonly driver: StorageDriver = storageDriver,
		private readonly seed: () => AppDatabase = createSeedDatabase,
		private readonly key: string = DB_STORAGE_KEY,
	) {}

	async load(): Promise<AppDatabase> {
		const stored = await this.driver.read<AppDatabase>(this.key)
		if (!stored || stored.version !== SCHEMA_VERSION) return this.reset()
		return stored
	}

	async save(db: AppDatabase): Promise<void> {
		await this.driver.write(this.key, db)
	}

	async reset(): Promise<AppDatabase> {
		const fresh = this.seed()
		await this.save(fresh)
		return fresh
	}
}

export const databaseRepository: DatabaseRepository = new LocalDatabaseRepository()
