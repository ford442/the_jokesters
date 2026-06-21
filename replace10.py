import re

file_path = 'src/Director/modes/DreamModes_Sentient.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Only keep the FIRST occurrence of the function
parts = content.split("export async function runSentientShoppingCartLoop")
if len(parts) > 2:
    # It exists multiple times. Let's rebuild the file with only the first occurrence.
    # The first split will contain everything before the first definition
    new_content = parts[0] + "export async function runSentientShoppingCartLoop"

    # The second split contains the body of the first definition, up to the next export
    # We need to find the end of the function body.
    body_and_rest = parts[1]

    # Just append everything up to the EOF of the first occurrence
    # Since we added it at the end with cat << EOF, it's safer to just remove our addition.

    # Re-read and remove our addition at the bottom
    with open(file_path, 'r') as f:
        lines = f.readlines()

    for i in range(len(lines)-1, -1, -1):
        if "export async function runSentientShoppingCartLoop" in lines[i]:
            lines = lines[:i]
            break

    with open(file_path, 'w') as f:
        f.writelines(lines)
