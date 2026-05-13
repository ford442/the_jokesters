self.onmessage = async (e: MessageEvent) => {
    const { type, queueKey, token, repoId, items } = e.data;

    if (type === 'sync') {
        if (!token || !items || !Array.isArray(items)) {
            self.postMessage({ type: 'sync_error', error: 'Missing token or invalid items format.' });
            return;
        }

        for (const item of items) {
            let attempt = 0;
            const maxAttempts = 5;
            let success = false;
            let currentRepoId = item.repoId || repoId;

            if (!currentRepoId) {
                console.error("No repository ID found for upload.");
                self.postMessage({ type: 'sync_error', error: 'No repository ID found.', item });
                continue;
            }

            let cleanRepoId = currentRepoId;
            if (cleanRepoId.startsWith("datasets/")) {
                cleanRepoId = cleanRepoId.replace("datasets/", "");
            }

            const commitUrl = `https://huggingface.co/api/datasets/${cleanRepoId}/commit/main`;

            const commitBody = {
                operations: [
                    {
                        operation: "createOrUpdateFile",
                        pathOrUrl: item.filename,
                        content: btoa(unescape(encodeURIComponent(item.content)))
                    }
                ],
                commitMessage: `Update ${item.filename}`,
            };

            while (attempt < maxAttempts && !success) {
                try {
                    const response = await fetch(commitUrl, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(commitBody),
                    });

                    if (response.ok) {
                        success = true;
                        self.postMessage({ type: 'sync_success', queueKey, itemId: item.id });
                    } else if (response.status === 429) {
                        attempt++;
                        const delay = Math.pow(2, attempt) * 1000;
                        console.warn(`HF Upload 429 Too Many Requests. Retrying in ${delay}ms...`);
                        await new Promise(r => setTimeout(r, delay));
                    } else {
                        const errText = await response.text();
                        console.error(`HF Upload failed: ${response.status} ${errText}`);
                        self.postMessage({ type: 'sync_error', error: `Upload failed: ${response.status}`, item });
                        break; // Stop retrying on non-429 errors
                    }
                } catch (error: any) {
                    attempt++;
                    const delay = Math.pow(2, attempt) * 1000;
                    console.warn(`HF Upload network error. Retrying in ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                }
            }

            if (!success && attempt >= maxAttempts) {
                self.postMessage({ type: 'sync_error', error: `Max retries reached for ${item.filename}`, item });
            }
        }

        self.postMessage({ type: 'sync_complete', queueKey });
    }
};

export {};
