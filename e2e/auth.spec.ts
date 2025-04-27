import { test, expect } from '@playwright/test';
import { LoginPage } from './models/LoginPage';
import { DashboardPage } from './models/DashboardPage';

test.describe('Autentykacja', () => {
  test('Poprawne logowanie przekierowuje do dashboard', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Act
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    
    // Assert
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });
  
  test('Błędne dane logowania pokazują komunikat błędu', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    
    // Act
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Assert
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
});
