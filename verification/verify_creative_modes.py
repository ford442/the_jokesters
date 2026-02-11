from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting creative modes verification...")
    with sync_playwright() as p:
        print("Launching browser...")
        # Note: WebGPU usually requires a real head or specific args, but for UI check headless is fine.
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        try:
            url = "http://localhost:5173"
            print(f"Navigating to {url}...")
            page.goto(url)

            # Wait for app load
            page.wait_for_selector("#roast-mode-btn", state="attached", timeout=60000)
            print("App loaded. Found Roast Mode button.")

            # 1. Verify Roast Mode
            print("Testing Roast Mode UI...")
            page.click("#roast-mode-btn")
            time.sleep(1) # Animation/Render buffer

            if page.is_visible("#roast-mode-controls"):
                print("PASS: Roast controls visible.")
            else:
                print("FAIL: Roast controls NOT visible.")
                raise Exception("Roast controls failed")

            if not page.is_visible("#improv-mode-controls") and not page.is_visible("#reporter-mode-controls"):
                 print("PASS: Other controls hidden.")
            else:
                 print("FAIL: Other controls still visible.")

            # 2. Verify Story Mode
            print("Testing Story Mode UI...")
            page.click("#story-mode-btn")
            time.sleep(1)

            if page.is_visible("#story-mode-controls"):
                print("PASS: Story controls visible.")
            else:
                print("FAIL: Story controls NOT visible.")
                raise Exception("Story controls failed")

            if not page.is_visible("#roast-mode-controls"):
                print("PASS: Roast controls hidden.")

            # 3. Verify Debate Mode
            print("Testing Debate Mode UI...")
            page.click("#debate-mode-btn")
            time.sleep(1)

            if page.is_visible("#debate-mode-controls"):
                print("PASS: Debate controls visible.")
            else:
                print("FAIL: Debate controls NOT visible.")
                raise Exception("Debate controls failed")

            # Screenshot
            screenshot_path = "verification/creative_modes_verified.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/creative_modes_failed.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
