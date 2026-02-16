from playwright.sync_api import sync_playwright
import time
import os

def verify(page):
    page.goto("http://localhost:5173")

    # Wait for app to load
    # page.wait_for_selector("text=Ready! Select a mode to begin.", timeout=20000)
    # The text might be different if model not loaded.
    # Just wait for buttons.
    page.wait_for_selector("#interview-mode-btn", timeout=20000)

    # Check for Podcast Mode button
    podcast_btn = page.locator("#interview-mode-btn")
    dm_btn = page.locator("#dm-mode-btn")

    if podcast_btn.is_visible():
        print("Podcast Mode button found.")
    else:
        print("Podcast Mode button NOT found.")

    if dm_btn.is_visible():
        print("DM Mode button found.")
    else:
        print("DM Mode button NOT found.")

    # Click Podcast Mode to see controls
    podcast_btn.click()
    time.sleep(1)
    os.makedirs("verification", exist_ok=True)
    page.screenshot(path="verification/podcast_mode.png")

    # Click DM Mode
    dm_btn.click()
    time.sleep(1)
    page.screenshot(path="verification/dm_mode.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify(page)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()
