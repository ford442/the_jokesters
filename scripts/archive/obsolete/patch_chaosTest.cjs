const fs = require('fs');
let content = fs.readFileSync('src/test/chaosTest.ts', 'utf8');

content = content.replace("this.engine.getCallbackMetrics(jokeId); // Verify metrics available", "const _metrics = this.engine.getCallbackMetrics(jokeId); // Verify metrics available");
content = content.replace("this.engine.getCallbackMetrics(jokeId); // Verify metrics retrieval works", "const metrics = this.engine.getCallbackMetrics(jokeId); // Verify metrics retrieval works");

fs.writeFileSync('src/test/chaosTest.ts', content);
