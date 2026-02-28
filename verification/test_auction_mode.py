import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Start a local server just for this script to test the dist folder
        import subprocess
        server = subprocess.Popen(["python3", "-m", "http.server", "8083", "--directory", "dist"])
        await asyncio.sleep(2) # Wait for server to start

        try:
            await page.goto("http://localhost:8083/")
            await page.wait_for_selector("text=The Jokesters")

            # Emulate the loading completion logic from previous scripts
            # 1. Hide #loading overlay manually
            await page.evaluate("document.getElementById('loading').style.display = 'none';")
            # Hide webgpu error if present
            await page.evaluate("""
                const err = document.getElementById('webgpu-error');
                if (err) err.style.display = 'none';
            """)
            # 2. Make #chat-container interactive
            await page.evaluate("""
                const chatContainer = document.getElementById('chat-container');
                chatContainer.classList.add('enabled');
                chatContainer.style.opacity = '1';
                chatContainer.style.pointerEvents = 'auto';
            """)

            # 3. Enable mode controls
            await page.evaluate("document.getElementById('auction-mode-btn').disabled = false;")
            await page.evaluate("document.getElementById('start-auction-btn').disabled = false;")

            # Test Auction House mode button
            print("Clicking Auction House mode button...")
            await page.click("button#auction-mode-btn")

            # Use specific CSS selector to wait for visibility
            await page.wait_for_function("document.getElementById('auction-mode-controls').style.display !== 'none'")

            print("Auction House controls are visible.")

            # Take screenshot
            os.makedirs("verification", exist_ok=True)
            await page.screenshot(path="verification/auction_mode_screenshot.png")
            print("Screenshot saved to verification/auction_mode_screenshot.png")

        finally:
            server.terminate()
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
