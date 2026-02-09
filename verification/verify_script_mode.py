from playwright.sync_api import sync_playwright

def run():
    print("Starting verification script...")
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        try:
            url = "http://localhost:5173"
            print(f"Navigating to {url}...")
            page.goto(url)

            # Wait for any content
            page.wait_for_load_state("networkidle")

            # Check if #app exists
            if page.locator("#app").count() > 0:
                print("#app found.")
            else:
                print("#app not found.")
                print("Page content:", page.content()[:500])

            print("Waiting for #script-mode-btn...")
            # increased timeout
            page.wait_for_selector("#script-mode-btn", state="attached", timeout=60000)
            print("Button attached. Checking visibility...")

            if page.is_visible("#script-mode-btn"):
                print("Button is visible.")
                page.click("#script-mode-btn")
            else:
                print("Button is not visible.")

            print("Waiting for #script-mode-controls...")
            page.wait_for_selector("#script-mode-controls", state="visible", timeout=10000)

            # Verify elements exist
            if page.is_visible("#script-topic"):
                print("Script Topic input is visible.")
            else:
                print("Script Topic input NOT visible.")

            if page.is_visible("#generate-script-btn"):
                print("Generate button is visible.")
            else:
                print("Generate button NOT visible.")

            # Take a screenshot
            screenshot_path = "verification/script_mode_verified.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/verification_failed.png")
            print("Saved failure screenshot.")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
