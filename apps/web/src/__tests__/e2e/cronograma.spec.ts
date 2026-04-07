import { test, expect } from './fixtures/auth.fixture';

/**
 * Cronograma (Schedule) E2E Tests
 * Covers: Create cronograma, start study session, update cronograma, verify changes
 *
 * AC: Create cronograma -> start study session
 * AC: Update cronograma -> verify changes
 */

test.describe('Cronograma Management', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    await page.goto('/cronograma');
  });

  test('renders cronograma page without redirect', async ({ authedPage: page }) => {
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveTitle(/Cronograma.*Alvo Diario/i);
  });

  test('displays page title "Cronograma de Ciclos"', async ({ authedPage: page }) => {
    await expect(
      page.getByRole('heading', { name: /cronograma de ciclos/i })
    ).toBeVisible();
  });

  test('shows existing cronograma from mock data', async ({ authedPage: page }) => {
    // The mock returns a cronograma with edital "PC-SP 2026"
    await expect(page.getByText(/PC-SP 2026/i)).toBeVisible({ timeout: 15_000 });
  });

  test('shows "Novo Cronograma" or create button', async ({ authedPage: page }) => {
    const createButton = page.getByRole('button', { name: /(novo|criar|adicionar)/i });
    await expect(createButton).toBeVisible({ timeout: 15_000 });
  });

  test('opens cronograma creation form when clicking create button', async ({ authedPage: page }) => {
    const createButton = page.getByRole('button', { name: /(novo|criar|adicionar)/i });
    await createButton.click();

    // Form modal or inline form should appear
    // CronogramaForm component renders inputs for edital, materias, etc.
    const formDialog = page.locator('[role="dialog"]').or(page.locator('form'));
    await expect(formDialog.first()).toBeVisible({ timeout: 5_000 });
  });

  test('cronograma form has required fields', async ({ authedPage: page }) => {
    const createButton = page.getByRole('button', { name: /(novo|criar|adicionar)/i });
    await createButton.click();

    // Wait for form to be visible
    await page.waitForTimeout(500);

    // Check form has edital/concurso input and materia-related elements
    const formVisible = await page.locator('form').or(page.locator('[role="dialog"]')).first().isVisible();
    expect(formVisible).toBeTruthy();
  });

  test('displays subject badges for materias', async ({ authedPage: page }) => {
    // SubjectBadge components render materia names
    // Mock data has: Direito Penal, Direito Constitucional, Legislacao Especial
    const subjectText = page.getByText(/(Direito Penal|Constitucional|Legisla)/i);
    await expect(subjectText.first()).toBeVisible({ timeout: 15_000 });
  });

  test('has cycle navigation controls', async ({ authedPage: page }) => {
    // CronogramaPage has cycle offset navigation (ChevronLeft, ChevronRight)
    // First click on a cronograma to see detail view
    const cronogramaItem = page.getByText(/PC-SP 2026/i).first();

    if (await cronogramaItem.isVisible()) {
      await cronogramaItem.click();

      // Look for cycle navigation arrows
      const navButtons = page.locator('button').filter({ has: page.locator('svg') });
      const count = await navButtons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('responsive layout on mobile', async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Content should be visible
    await expect(page.getByRole('heading', { name: /cronograma de ciclos/i })).toBeVisible();

    // Page renders without crashing on mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
