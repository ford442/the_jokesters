from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    print("Navigating to app...")
    try:
        page.goto("http://localhost:5173/")
    except Exception as e:
        print(f"Error navigating: {e}")
        return

    print("Waiting for window.getDirector...")
    try:
        page.wait_for_function("() => window.getDirector && window.getDirector()", timeout=10000)
    except Exception as e:
        print(f"Director NOT available: {e}")

    # Inject fake history
    print("Injecting fake history...")
    page.evaluate("""() => {
        const manager = window.getGroupChatManager();
        if (manager) {
            if (!manager.conversationHistory) manager.conversationHistory = [];
            manager.conversationHistory.push({ role: 'user', content: 'Test 1' });
            manager.conversationHistory.push({ role: 'assistant', content: 'Response 1' });
            manager.conversationHistory.push({ role: 'user', content: 'Test 2' });
            manager.conversationHistory.push({ role: 'assistant', content: 'Response 2' });
            manager.conversationHistory.push({ role: 'user', content: 'Test 3' });
        }
    }""")

    # Start scene manually
    print("Starting scene...")
    page.evaluate("""() => {
        const director = window.getDirector();
        if (director) {
            director.isRunning = true;
            director.currentScenario = {
                type: 'improv',
                title: 'Test Scenario',
                description: 'Test Description',
                config: {}
            };
        }
    }""")

    time.sleep(1)

    # Stop scene
    print("Stopping scene...")
    page.evaluate("""() => {
        const director = window.getDirector();
        if (director) {
            director.stopScene();
        }
    }""")

    # Verify the message in chat log and screenshot
    print("Verifying autosave message...")
    try:
        locator = page.locator("#chat-log .message:has-text('Episode auto-saved')")
        locator.wait_for(state="visible", timeout=5000)
        print("PASS: Autosave message found.")

        # Take screenshot
        page.screenshot(path="verification/autosave_toast.png")
        print("Screenshot saved to verification/autosave_toast.png")

    except Exception as e:
        print(f"FAIL: Autosave message not found. Error: {e}")
        page.screenshot(path="verification/fail_autosave_toast.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
