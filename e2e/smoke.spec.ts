import { test, expect } from '@playwright/test'

// Full user journey against a real, seeded backend:
// login → list renders → create → search finds it → edit → delete → logout.
// Prerequisite: backend running on :8000, seeded (`php artisan migrate --seed`).

const stamp = Date.now()
const name = `E2E Smoke ${stamp}`
const updatedName = `${name} Updated`

test('smoke: login, CRUD a contact, logout', async ({ page }) => {
  // Login with the seeded account
  await page.goto('/login')
  await page.getByLabel('Email').fill('test@example.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Log in' }).click()

  // The list renders seeded rows
  await expect(page).toHaveURL(/\/contacts/)
  await expect(page.locator('table tbody tr').first()).toBeVisible()

  // Create a contact
  await page.getByRole('button', { name: 'Add contact' }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Phone').fill('+1 (555) 123-4567')
  await page.getByLabel('Email').fill(`e2e-${stamp}@example.com`)
  await page
    .getByRole('group', { name: 'Gender' })
    .getByRole('button', { name: 'Other' })
    .click()
  await page.getByLabel('Age').fill('33')
  await page.getByLabel('Nationality').fill('Testland')
  await page.getByRole('button', { name: 'Create contact' }).click()

  // Create lands on the details page
  await expect(page.getByText(name).first()).toBeVisible()

  // Search finds it (list state lives in the URL)
  await page.goto(`/contacts?search=${stamp}`)
  await expect(page.locator('table tbody tr')).toHaveCount(1)
  await expect(page.locator('table tbody tr').first()).toContainText(name)

  // Edit it
  await page.getByRole('button', { name: `Edit ${name}` }).click()
  await expect(page.getByLabel('Name')).toHaveValue(name)
  await page.getByLabel('Name').fill(updatedName)
  await page.getByRole('button', { name: 'Save changes' }).click()

  await page.goto(`/contacts?search=${stamp}`)
  await expect(page.locator('table tbody tr')).toHaveCount(1)
  await expect(page.locator('table tbody tr').first()).toContainText(updatedName)

  // Delete it (confirm dialog) and assert it is gone
  await page.getByRole('button', { name: `Delete ${updatedName}` }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete' })
    .click()
  await expect(page.locator('table tbody tr')).toHaveCount(0)

  // Logout (via the avatar menu) returns to the login page
  await page.locator('button[aria-haspopup="menu"]').click()
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login/)
})
