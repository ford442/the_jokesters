1. **Parse Velocity & Update Plan**
   - Read `agent_plan.md` to see velocity (tasks_per_run: 4)
   - Note the pending tasks from memory/roadmap:
     - "Parallel Universe Cable TV Mode" (New Idea -> Implemented)
     - "Sentient Cloud Infrastructure Mode" (New Idea -> Implemented)
     - "Time-Traveling IRS Audit Mode" (New Idea -> Implemented)
     - "Sentient Shopping Cart Mode" (Pending Task/New Idea)
2. **Implement "Sentient Shopping Cart Mode" in `DreamModes_Sentient.ts`**
   - Create `runSentientShoppingCartLoop` logic with Comedian, Scientist, and Philosopher.
3. **Register remaining new modes**
   - `sentient_shopping_cart`
   - Add to `Scenario` type and `MODE_LOOPS` in `src/Director/Director.ts`.
   - Add `sentient_shopping_cart` to `src/config/improvSetups.ts`.
4. **Update `agent_plan.md`**
   - Move completed tasks to "Completed".
   - Update "Dream Phase" with specific ideas regarding Cloud Storage differential sync (CRDTs) and Episode Analytics Dashboard.
5. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
