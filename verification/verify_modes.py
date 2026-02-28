from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5173")

        # Manually hide loading screen since we can't wait for LLM to load in headless/no-gpu environment
        print("Forcing UI state...")
        page.evaluate("""() => {
            const loading = document.getElementById('loading');
            if (loading) loading.remove();

            const error = document.getElementById('webgpu-error');
            if (error) error.remove();

            const chat = document.getElementById('chat-container');
            if (chat) {
                chat.style.opacity = '1';
                chat.style.pointerEvents = 'auto';
                chat.classList.add('enabled');
            }
        }""")

        # Verify buttons exist in the mode selector
        print("Verifying new buttons...")

        # 1. Haunted House Button
        haunted_btn = page.locator("#haunted-mode-btn")
        expect(haunted_btn).to_be_visible()
        expect(haunted_btn).to_have_text("Haunted House")

        # 2. SportsCast Button
        sports_btn = page.locator("#sports-mode-btn")
        expect(sports_btn).to_be_visible()
        expect(sports_btn).to_have_text("SportsCast")

        # 3. Reality TV Button
        reality_btn = page.locator("#reality-mode-btn")
        expect(reality_btn).to_be_visible()
        expect(reality_btn).to_have_text("Reality TV")

        print("Buttons verified. Clicking Haunted House...")
        haunted_btn.click()

        # Verify the controls panel appeared
        haunted_controls = page.locator("#haunted-mode-controls")
        expect(haunted_controls).to_be_visible()

        # Verify inputs inside
        expect(page.locator("#haunted-setting")).to_be_visible()
        expect(page.locator("#start-haunted-btn")).to_be_visible()

        print("Haunted controls verified. Clicking SportsCast...")
        sports_btn.click()
        expect(page.locator("#sports-mode-controls")).to_be_visible()
        expect(page.locator("#sports-activity")).to_be_visible()

        print("Sports controls verified. Clicking Reality TV...")
        reality_btn.click()
        expect(page.locator("#reality-mode-controls")).to_be_visible()
        expect(page.locator("#reality-show-name")).to_be_visible()

        print("Reality controls verified. Taking screenshot...")
        page.screenshot(path="verification/new_modes_verified.png")

        browser.close()
        print("Verification complete!")

if __name__ == "__main__":
    run()
