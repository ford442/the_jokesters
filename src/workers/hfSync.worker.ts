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

            // If item provides custom operations, use them, otherwise default to createOrUpdateFile
            let operations = item.operations;
            if (!operations) {
                operations = [{
                    operation: "createOrUpdateFile",
                    pathOrUrl: item.filename,
                    content: btoa(unescape(encodeURIComponent(item.content)))
                }];
            }

            const commitBody = {
                operations: operations,
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
    } else if (type === 'consolidate_deltas') {
        const { episodeId } = e.data;
        if (!token || !repoId || !episodeId) {
            self.postMessage({ type: 'sync_error', error: 'Missing token, repoId, or episodeId for consolidation.' });
            return;
        }

        try {
            let cleanRepoId = repoId;
            if (cleanRepoId.startsWith("datasets/")) {
                cleanRepoId = cleanRepoId.replace("datasets/", "");
            }

            const treeUrl = `https://huggingface.co/api/datasets/${cleanRepoId}/tree/main/episodes/${episodeId}`;
            const treeResponse = await fetch(treeUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!treeResponse.ok) {
                self.postMessage({ type: 'sync_error', error: `Failed to fetch tree: ${treeResponse.status}` });
                return;
            }

            const files = await treeResponse.json();
            const deltaFiles = files.filter((f: any) => f.type === 'file' && f.path.includes("delta-"));
            if (deltaFiles.length === 0) {
                self.postMessage({ type: 'consolidation_complete', episodeId });
                return;
            }

            // Download main episode
            const episodeFilename = `episodes/${episodeId}/episode.json`;
            const rawFileUrl = `https://huggingface.co/datasets/${cleanRepoId}/resolve/main/${episodeFilename}`;
            let mainEpisode: { history: any[] } = { history: [] };

            try {
                const episodeResponse = await fetch(rawFileUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (episodeResponse.ok) {
                    mainEpisode = await episodeResponse.json();
                }
            } catch (e) {
                // Keep default empty mainEpisode if fetch fails
            }

            // Sort deltas by timestamp to resolve concurrent sync conflicts
            // Filename format: delta-<timestamp>-<random>.json
            const sortedDeltas = deltaFiles.sort((a: any, b: any) => {
                const aMatch = a.path.match(/delta-(\d+)-/);
                const bMatch = b.path.match(/delta-(\d+)-/);
                const aTime = aMatch ? parseInt(aMatch[1], 10) : 0;
                const bTime = bMatch ? parseInt(bMatch[1], 10) : 0;

                if (aTime === bTime) {
                   return a.path.localeCompare(b.path);
                }
                return aTime - bTime;
            });

            // Download and merge all deltas in chronological order
            for (const deltaFile of sortedDeltas) {
                const deltaUrl = `https://huggingface.co/datasets/${cleanRepoId}/resolve/main/${deltaFile.path}`;
                try {
                    const deltaResponse = await fetch(deltaUrl, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (deltaResponse.ok) {
                        const deltaMessage = await deltaResponse.json();
                        // Avoid duplicating messages if they somehow got synced multiple times
                        const exists = mainEpisode.history.find((m: any) => m.content === deltaMessage.content && m.role === deltaMessage.role);
                        if (!exists) {
                            mainEpisode.history.push(deltaMessage);
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch delta file", deltaFile.path, e);
                }
            }

            // Now we have the merged episode, let's commit it and delete the deltas
            const allOperations: any[] = [{
                operation: "createOrUpdateFile",
                pathOrUrl: episodeFilename,
                content: btoa(unescape(encodeURIComponent(JSON.stringify(mainEpisode, null, 2))))
            }];

            for (const deltaFile of deltaFiles) {
                allOperations.push({
                    operation: "deleteFile",
                    pathOrUrl: deltaFile.path
                });
            }

            const commitUrl = `https://huggingface.co/api/datasets/${cleanRepoId}/commit/main`;

            // Chunk operations into batches of 50 to avoid HF API timeouts
            const chunkSize = 50;
            for (let i = 0; i < allOperations.length; i += chunkSize) {
                const chunk = allOperations.slice(i, i + chunkSize);
                const commitBody = {
                    operations: chunk,
                    commitMessage: `Consolidate deltas for ${episodeFilename} (Part ${Math.floor(i / chunkSize) + 1})`,
                };

                const commitResponse = await fetch(commitUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(commitBody),
                });

                if (!commitResponse.ok) {
                    const errText = await commitResponse.text();
                    console.error(`HF Upload failed for chunk: ${commitResponse.status} ${errText}`);
                    self.postMessage({ type: 'sync_error', error: `Upload failed: ${commitResponse.status}` });
                    return;
                }
            }

            self.postMessage({ type: 'consolidation_complete', episodeId });
        } catch (e: any) {
            self.postMessage({ type: 'sync_error', error: e.message });
        }
    }
};

export {};
