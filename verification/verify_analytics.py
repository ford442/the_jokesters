import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # We start the dev server before running this, so we assume localhost:5173
        await page.goto("http://localhost:5173")

        # Wait for app
        await page.wait_for_selector("#app", timeout=10000)

        # Wait for the cloud dashboard button
        await page.wait_for_selector("#cloud-dashboard-btn", state="attached", timeout=10000)

        # We need to force it to be visible or execute JS to click it
        await page.evaluate("""() => {
            document.getElementById('cloud-dashboard-btn').click();
        }""")

        # Wait for modal
        await page.wait_for_selector("#cloud-dashboard-modal", state="visible")

        # Click view analytics
        await page.evaluate("""() => {
            document.getElementById('view-analytics-btn').click();
        }""")

        # Wait for container
        await page.wait_for_selector("#episode-analytics-container", state="visible")

        # Take a screenshot
        await page.screenshot(path="verification/analytics.png")
        print("Analytics modal shown and captured!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
