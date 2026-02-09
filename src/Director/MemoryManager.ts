export class MemoryManager {
    private prefix: string = 'jokesters-';

    constructor() {}

    public save(key: string, data: any): void {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this.prefix + key, serialized);
        } catch (error) {
            console.error('MemoryManager save error:', error);
        }
    }

    public load<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;
            return JSON.parse(item) as T;
        } catch (error) {
            console.error('MemoryManager load error:', error);
            return null;
        }
    }

    public remove(key: string): void {
        localStorage.removeItem(this.prefix + key);
    }

    public saveEpisode(episodeId: string, data: any): void {
        this.save(`episode-${episodeId}`, data);
    }

    public loadEpisode(episodeId: string): any | null {
        return this.load(`episode-${episodeId}`);
    }

    public listEpisodes(): string[] {
        const episodes: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix + 'episode-')) {
                episodes.push(key.replace(this.prefix + 'episode-', ''));
            }
        }
        return episodes;
    }
}
