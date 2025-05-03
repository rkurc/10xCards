import { test, expect } from '@playwright/test';
import { LoginPage } from './models/LoginPage';
import { DashboardPage } from './models/DashboardPage';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
  
  test('Dashboard wyświetla karty akcji', async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    
    // Assert
    await expect(dashboardPage.generateCard).toBeVisible();
    await expect(dashboardPage.setsCard).toBeVisible();
    await expect(dashboardPage.learnCard).toBeVisible();
  });
  
  test('Nawigacja do generowania fiszek', async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    
    // Act
    await dashboardPage.navigateToGenerate();
    
    // Assert
    await expect(page).toHaveURL(/.*generate/);
  });
  
  test('Nawigacja do zestawów fiszek', async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    
    // Act
    await dashboardPage.navigateToSets();
    
    // Assert
    await expect(page).toHaveURL(/.*sets/);
  });
});
