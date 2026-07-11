import re

with open("src/config/improvSetups.ts", "r") as f:
    content = f.read()

new_setups = """
    {
        id: 'philosophical_elevator_pitch',
        title: 'Philosophical Elevator Pitch',
        description: 'Pitching an idea to a VC while they fall down a bottomless pit.',
    },
    {
        id: 'philosophical_debugging',
        title: 'Philosophical Debugging Mode',
        description: 'Agents play a compiler, a runtime, and a programmer arguing over the meaning of a segfault.',
    },
    {
        id: 'alien_abduction_support_group',
        title: 'Alien Abduction Support Group',
        description: 'Abductees are more annoyed about missing work than the abduction itself.',
    },
    {
        id: 'time_traveling_hoa_president',
        title: 'Time-Traveling HOA President',
        description: 'An HOA president tries to enforce rules on a time traveler.',
    },
"""

# The line we are looking for is export const DEFAULT_IMPROV_SETUPS: ImprovSetup[] = [
content = content.replace("export const DEFAULT_IMPROV_SETUPS: ImprovSetup[] = [", "export const DEFAULT_IMPROV_SETUPS: ImprovSetup[] = [" + new_setups)

with open("src/config/improvSetups.ts", "w") as f:
    f.write(content)
