from playwright.sync_api import sync_playwright

def verify_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # Wait for app to load
            page.wait_for_selector("h1")

            # Check for Musical Mode button
            musical_btn = page.get_by_role("button", name="Musical Mode")
            if musical_btn.is_visible():
                print("Musical Mode button found!")
            else:
                print("ERROR: Musical Mode button not found.")

            # Click it to see controls
            musical_btn.click()

            # Check for musical controls
            controls = page.locator("#musical-mode-controls")
            if controls.is_visible():
                print("Musical controls visible!")
            else:
                print("ERROR: Musical controls not visible after click.")

            # Check for Voice Input button
            # It's in #chat-mode-controls which might be hidden in musical mode
            # But let's check if it exists in DOM
            voice_btn = page.locator("#voice-input-btn")
            if voice_btn.count() > 0:
                print("Voice Input button found in DOM.")
            else:
                print("ERROR: Voice Input button not found in DOM.")

            # Switch back to chat mode to see voice button
            page.get_by_role("button", name="Chat Mode").click()
            if voice_btn.is_visible():
                print("Voice Input button visible in Chat Mode.")
            else:
                print("ERROR: Voice Input button not visible in Chat Mode.")

            page.screenshot(path="verification/feature_verification.png")
            print("Screenshot saved to verification/feature_verification.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_features()
