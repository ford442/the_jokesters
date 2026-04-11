import subprocess

def run_tests():
    print("Running basic build checks...")
    result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
    if result.returncode != 0:
        print("Build failed!")
        print(result.stdout)
        print(result.stderr)
        return False

    print("Build successful!")
    return True

if __name__ == "__main__":
    if run_tests():
        print("All tests passed.")
    else:
        print("Tests failed.")
        exit(1)
