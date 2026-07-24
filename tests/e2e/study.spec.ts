import { test, expect } from '@playwright/test'

test.describe('Kanji SRS Application', () => {
  test('Dashboard loads and displays initial state', async ({ page }) => {
    await page.goto('/')

    // Check Header & Logo
    await expect(page.locator('header')).toContainText('Kanji SRS')

    // Check Metrics Cards
    await expect(page.getByText('Due Today')).toBeVisible()
    await expect(page.getByText('New Intake')).toBeVisible()
    await expect(page.getByText('N5 Mastery Progress')).toBeVisible()
  })

  test('Complete a study session flow', async ({ page }) => {
    await page.goto('/study')

    // Expect to see Question Card
    await expect(page.getByText('Show Answer')).toBeVisible()

    // Reveal Answer
    await page.getByText('Show Answer').click()

    // Expect to see Revealed Details & FSRS Grade Buttons
    await expect(page.getByText('Meaning')).toBeVisible()
    await expect(page.getByText('Again')).toBeVisible()
    await expect(page.getByText('Hard')).toBeVisible()
    await expect(page.getByText('Good')).toBeVisible()
    await expect(page.getByText('Easy')).toBeVisible()

    // Grade Good (3)
    await page.getByText('Good').click()
  })

  test('Kanji browse page filter and detail modal', async ({ page }) => {
    await page.goto('/browse')
    await page.waitForLoadState('networkidle')

    // Click first kanji card in grid
    const kanjiCard = page.locator('[data-testid="kanji-grid"] button').first()
    await expect(kanjiCard).toBeVisible()
    await kanjiCard.click()

    // Wait for modal content to be visible
    await expect(page.getByText("On'yomi (音読み)")).toBeVisible({ timeout: 10000 })
  })

  test('Stats page loads metrics and export options', async ({ page }) => {
    await page.goto('/stats')

    await expect(page.getByText('Retention Rate', { exact: true })).toBeVisible()
    await expect(page.getByText('30-Day Review Forecast')).toBeVisible()
    await expect(page.getByText('Export Progress JSON')).toBeVisible()
  })
})
