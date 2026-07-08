import re

with open("src/Director/Director.ts", "r") as f:
    content = f.read()

# Add imports
imports = [
    ("runPhilosophicalElevatorPitchLoop", "DreamModes_Tech"),
    ("runPhilosophicalDebuggingLoop", "DreamModes_Tech"),
    ("runAlienAbductionSupportGroupLoop", "DreamModes_Scifi"),
    ("runTimeTravelingHOAPresidentLoop", "DreamModes_Temporal")
]

for func, file in imports:
    if func not in content:
        # Find the import for this file and add the function
        import_stmt = f"import {{ {func} }} from './modes/{file}';"
        content = import_stmt + "\n" + content

# Add to type
types = [
    "philosophical_elevator_pitch",
    "philosophical_debugging",
    "alien_abduction_support_group",
    "time_traveling_hoa_president"
]

for t in types:
    if f"'{t}'" not in content:
        content = content.replace("'undercover_boss_ai' |", f"'{t}' | 'undercover_boss_ai' |")

# Add to MODE_LOOPS
loops = [
    ("philosophical_elevator_pitch", "runPhilosophicalElevatorPitchLoop"),
    ("philosophical_debugging", "runPhilosophicalDebuggingLoop"),
    ("alien_abduction_support_group", "runAlienAbductionSupportGroupLoop"),
    ("time_traveling_hoa_president", "runTimeTravelingHOAPresidentLoop")
]

for t, f in loops:
    if f"{t}:" not in content:
        # Find MODE_LOOPS
        idx = content.find("export const MODE_LOOPS: Record<Scenario['type'], (scenario: Scenario, ctx: ModeContext) => Promise<void>> = {")
        if idx != -1:
            idx = content.find("{", idx)
            content = content[:idx+1] + f"\n    {t}: {f}," + content[idx+1:]

with open("src/Director/Director.ts", "w") as f:
    f.write(content)
