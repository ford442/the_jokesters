1. **Add Vite PWA Plugin Support**
   - Update `vite.config.ts` to import `VitePWA` from `vite-plugin-pwa` and add it to the plugins array.
   - Configure `VitePWA` with the `injectManifest` strategy and point it to `src/service-worker.ts`.
   - Update `src/main.ts` to use `virtual:pwa-register` to register the service worker, matching the provided memory hint.

2. **Implement Vector Clocks in MemoryManager**
   - In `src/Director/MemoryManager.ts`, ensure `clientId` is initialized and retrieved via `localStorage`.
   - Add a `vectorClock: Record<string, number>` property to the episode data structure.
   - When saving an episode locally (`saveEpisode`), update the `vectorClock` for the current `clientId`.
   - When resolving conflicts during cloud sync (`ensureCloudSummaryCache` -> `loadEpisodeFromCloud`), compare the `vectorClock` to determine if a merge is needed or which version wins, instead of just using LWW (timestamp). Update the merge logic appropriately.
   - For deltas, include the `vectorClock` when saving to the cloud (`saveEpisodeDeltaToCloud` and `saveEpisodeToCloud`).

3. **Update `agent_plan.md`**
   - Mark pending items related to vector clocks and offline PWA support as completed `[x]`.
   - Add a new "Project Velocity" section (or update existing) with `tasks_per_run: 2`.
   - Add new creative modes under the "Dream Phase" section.
   - Detail the steps taken for Cloud Persistence.

4. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Submit the change.**
   - Submit the git commit with the corresponding title and description.
