import type { HFHistoryEntry } from './memoryTypes';

export class HFStorageManager {
    private apiBase = "https://huggingface.co/api";

    constructor() {}

    /**
     * Validates the provided Hugging Face token.
     * @param token The HF API token.
     * @returns True if valid, false otherwise.
     */
    public async validateToken(token: string): Promise<boolean> {
        if (!token) return false;
        try {
            const response = await fetch(`${this.apiBase}/whoami-v2`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.ok;
        } catch (error) {
            console.error("HF Token validation failed:", error);
            return false;
        }
    }

    /**
     * Uploads a file to the Hugging Face Dataset.
     * @param token The HF API token.
     * @param repoId The repository ID (e.g., "user/jokesters-episodes").
     * @param filename The path/filename in the repo.
     * @param content The string content to save.
     */
    public async saveFile(token: string, repoId: string, filename: string, content: string): Promise<void> {
        if (!token || !repoId) throw new Error("Missing token or repoId");

        // Assume it's a dataset as per plan.
        // Endpoint: POST /api/datasets/{repo_id}/commit/{revision}
        // If repoId already contains "datasets/", strip it to avoid duplication if the API needs clean ID,
        // but the API usually is /api/datasets/user/repo...

        let cleanRepoId = repoId;
        if (cleanRepoId.startsWith("datasets/")) {
            cleanRepoId = cleanRepoId.replace("datasets/", "");
        }

        const commitUrl = `${this.apiBase}/datasets/${cleanRepoId}/commit/main`;

        // Commit API payload
        // Note: The structure for `operations` is:
        // { pathInRepo: "...", base64Content: "..." } ?? No, it depends on the specific API version.
        // The common structure is:
        // operations: [ { key: "createOrUpdateFile", value: { path: "...", content: "..." } } ] -- specific to some clients
        // The standard REST API documentation says:
        // POST /api/models/.../commit/...
        // Body: { operations: [ { pathOrUrl: "...", content: "base64..." } ], ... }
        // Let's use the one from `huggingface.js` source if possible, but standard REST is safer.

        // Actually, the simplest way for a single file is the PUT endpoint if supported for datasets.
        // PUT /api/datasets/{repo_id}/upload/{path_in_repo}

        // Let's try the commit payload format used commonly:
        const commitBody = {
            operations: [
                {
                    operation: "createOrUpdateFile",
                    pathOrUrl: filename,
                    content: btoa(unescape(encodeURIComponent(content))) // Base64
                }
            ],
            commitMessage: `Update ${filename}`,
        };

        const response = await fetch(commitUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(commitBody),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HF Upload failed: ${response.status} ${errText}`);
        }
    }

    /**
     * Downloads a file from the Hugging Face Dataset.
     * @param token The HF API token (optional if public).
     * @param repoId The repository ID (e.g., "user/jokesters-episodes").
     * @param filename The path/filename in the repo.
     */
    public async loadFile(token: string, repoId: string, filename: string): Promise<string | null> {
        let cleanRepoId = repoId;
        if (cleanRepoId.startsWith("datasets/")) {
            cleanRepoId = cleanRepoId.replace("datasets/", "");
        }

        const url = `https://huggingface.co/datasets/${cleanRepoId}/resolve/main/${filename}`;

        try {
            const headers: HeadersInit = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(url, { headers });
            if (!response.ok) {
                if (response.status === 404) return null; // File not found is valid result
                throw new Error(`HF Download failed: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error("HF Download failed:", error);
            return null;
        }
    }

    /**
     * Downloads a file from a public Hugging Face Dataset (no token required).
     * @param repoId The repository ID (e.g., "TheJokesters/community-scripts").
     * @param filename The path/filename in the repo.
     */
    /**
     * Uploads a community script to a public Hugging Face Dataset.
     * @param token The HF API token with write access to the community repo.
     * @param repoId The community repository ID.
     * @param filename The desired filename for the script.
     * @param content The script content to save.
     */
    public async publishCommunityScript(token: string, repoId: string, filename: string, content: string): Promise<void> {
        return this.saveFile(token, repoId, filename, content);
    }

    /**
     * Downloads a file from a public Hugging Face Dataset (no token required).
     * @param repoId The repository ID (e.g., "TheJokesters/community-scripts").
     * @param filename The path/filename in the repo.
     */
    public async loadCommunityScript(repoId: string, filename: string): Promise<string | null> {
        let cleanRepoId = repoId;
        if (cleanRepoId.startsWith("datasets/")) {
            cleanRepoId = cleanRepoId.replace("datasets/", "");
        }

        const url = `https://huggingface.co/datasets/${cleanRepoId}/resolve/main/${filename}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) return null; // File not found
                throw new Error(`HF Community Script Download failed: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error("HF Community Script Download failed:", error);
            return null;
        }
    }

    /**
     * Fetches the commit history of a dataset to show granular file revisions.
     * @param token The HF API token.
     * @param repoId The repository ID.
     */
    public async getDatasetHistory(token: string, repoId: string): Promise<HFHistoryEntry[]> {
        if (!token || !repoId) throw new Error("Missing token or repoId");

        let cleanRepoId = repoId;
        if (cleanRepoId.startsWith("datasets/")) {
            cleanRepoId = cleanRepoId.replace("datasets/", "");
        }

        const url = `${this.apiBase}/datasets/${cleanRepoId}/paths-info/main`;
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const treeUrl = `${this.apiBase}/datasets/${cleanRepoId}/tree/main`;
                const treeResponse = await fetch(treeUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!treeResponse.ok) {
                    throw new Error(`HF History fetch failed: ${treeResponse.status}`);
                }
                return await treeResponse.json();
            }
            return await response.json();
        } catch (error) {
            console.error("HF History fetch failed:", error);
            return [];
        }
    }
}
