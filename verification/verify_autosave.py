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

    # Wait for the app to initialize the globals
    print("Waiting for window.getDirector...")
    try:
        page.wait_for_function("() => window.getDirector && window.getDirector()", timeout=10000)
        print("Director available.")
    except Exception as e:
        print(f"Director NOT available: {e}")
        # Continue anyway to see if we can salvage

    # Inject fake history
    print("Injecting fake history...")
    history_len = page.evaluate("""() => {
        const manager = window.getGroupChatManager();
        if (manager) {
            if (!manager.conversationHistory) manager.conversationHistory = [];

            manager.conversationHistory.push({ role: 'user', content: 'Test 1' });
            manager.conversationHistory.push({ role: 'assistant', content: 'Response 1' });
            manager.conversationHistory.push({ role: 'user', content: 'Test 2' });
            manager.conversationHistory.push({ role: 'assistant', content: 'Response 2' });
            manager.conversationHistory.push({ role: 'user', content: 'Test 3' });

            return manager.getHistoryLength();
        }
        return -1;
    }""")
    print(f"History length: {history_len}")

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
            console.log("Scene started manually");
        } else {
            console.error("Director is null in start scene block");
        }
    }""")

    # Wait a bit
    time.sleep(1)

    # Stop scene
    print("Stopping scene...")
    page.evaluate("""() => {
        const director = window.getDirector();
        if (director) {
            director.stopScene();
            console.log("Scene stopped manually");
        } else {
            console.error("Director is null in stop scene block");
        }
    }""")

    # Verify the message in chat log
    print("Verifying autosave message...")
    try:
        locator = page.locator("#chat-log .message:has-text('Episode auto-saved')")
        locator.wait_for(state="visible", timeout=5000)
        print("PASS: Autosave message found.")
    except Exception as e:
        print(f"FAIL: Autosave message not found. Error: {e}")
        logs = page.locator("#chat-log").inner_text()
        print("Chat Log Content:\n", logs)

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
