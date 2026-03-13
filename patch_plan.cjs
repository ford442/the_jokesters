const fs = require('fs');
let code = fs.readFileSync('agent_plan.md', 'utf8');

code = code.replace(
    /\* \*\*tasks_per_run\*\*: 3\n\* \*\*status\*\*: Proceeding smoothly\. Today's checkout cycle successfully implemented 3 new features: Semantic Search across episodes, Community Scripts from HF, and Visual Context \(Vision\) support\. The velocity feels appropriate for the complexity, so it remains at 3 for now\./,
    "* **tasks_per_run**: 3\n* **status**: Proceeding smoothly. Today's checkout cycle successfully implemented 3 new features: User Profile Sync, IndexedDB Migration, and The Intervention Mode. The velocity feels appropriate for the complexity, so it remains at 3 for now."
);

code = code.replace(
    /\* \[ \] \*\*IndexedDB Migration\*\*:/,
    "* [x] **IndexedDB Migration**:"
);

code = code.replace(
    /\* \[ \] \*\*User Profile Sync\*\*:/,
    "* [x] **User Profile Sync**:"
);

code = code.replace(
    /\* \[ \] \*\*The Intervention Mode\*\*:/,
    "* [x] **The Intervention Mode**:"
);

const newModes = `* [ ] **Historical Courtroom**: Agents are historical figures suing each other (e.g. Einstein suing Newton for gravity).
* [ ] **The Fortune Teller Mode**: Agents act as mystical seers interpreting the user's future from random, absurd objects.
* [ ] **Parallel Universe Mode**: Agents communicate with alternate versions of themselves who made different life choices.`;

code = code.replace(
    /\* \[ \] \*\*Historical Courtroom\*\*: Agents are historical figures suing each other \(e\.g\. Einstein suing Newton for gravity\)\./,
    newModes
);

fs.writeFileSync('agent_plan.md', code);
