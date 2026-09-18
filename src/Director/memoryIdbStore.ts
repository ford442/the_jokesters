/**
 * Profile-namespaced IndexedDB access shared by MemoryManager's episode store
 * and sync queue. `getProfile` is a live callback (not a snapshot) so a
 * profile switch mid-session is picked up by the next read/write.
 */
export class MemoryIdbStore {
    private dbName = 'jokestersDB';
    private storeName = 'episodes';
    private queueStoreName = 'syncQueue';

    constructor(private getProfile: () => string) {}

    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
                if (!db.objectStoreNames.contains(this.queueStoreName)) {
                    db.createObjectStore(this.queueStoreName);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async setQueue<T>(key: string, val: T): Promise<void> {
        const db = await this.openDB();
        const namespacedKey = `${this.getProfile()}-${key}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.queueStoreName, 'readwrite');
            const store = tx.objectStore(this.queueStoreName);
            const request = store.put(val, namespacedKey);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getQueue<T>(key: string): Promise<T | undefined> {
        const db = await this.openDB();
        const namespacedKey = `${this.getProfile()}-${key}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.queueStoreName, 'readonly');
            const store = tx.objectStore(this.queueStoreName);
            const request = store.get(namespacedKey);
            request.onsuccess = () => resolve(request.result as T | undefined);
            request.onerror = () => reject(request.error);
        });
    }

    async set<T>(key: string, val: T): Promise<void> {
        const db = await this.openDB();
        const namespacedKey = `${this.getProfile()}-${key}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put(val, namespacedKey);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async get<T>(key: string): Promise<T | undefined> {
        const db = await this.openDB();
        const namespacedKey = `${this.getProfile()}-${key}`;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(namespacedKey);
            request.onsuccess = () => resolve(request.result as T | undefined);
            request.onerror = () => reject(request.error);
        });
    }

    async keys(): Promise<string[]> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.getAllKeys();
            request.onsuccess = () => {
                const keys = request.result as string[];
                const prefix = `${this.getProfile()}-`;
                resolve(keys.filter(k => k.startsWith(prefix)).map(k => k.substring(prefix.length)));
            };
            request.onerror = () => reject(request.error);
        });
    }
}
