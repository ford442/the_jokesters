import re

with open("agent_plan.md", "r") as f:
    text = f.read()

text = text.replace("| **VRAM / compile (P1)** | [#305](https://github.com/ford442/the_jokesters/issues/305) ship ctx512/1024 `model_lib` (closes gap in [#216](https://github.com/ford442/the_jokesters/issues/216)); ADR 0001 — TS-first, no C++ thrash |", "| **VRAM / compile (P1)** | [x] [#305](https://github.com/ford442/the_jokesters/issues/305) ship ctx512/1024 `model_lib` (closes gap in [#216](https://github.com/ford442/the_jokesters/issues/216)); ADR 0001 — TS-first, no C++ thrash |")

with open("agent_plan.md", "w") as f:
    f.write(text)
