import { test, expect } from '@playwright/test';
import { LoginPage } from './models/LoginPage';
import { DashboardPage } from './models/DashboardPage';

test.describe('Autentykacja', () => {
  const TEST_USER = {
    email: process.env.E2E_USERNAME || 'piotr.supa@test.org',
    password: process.env.E2E_PASSWORD || '@T3stP4ssw0rd!@#'
  };

  test('Poprawne logowanie przekierowuje do dashboard', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Act
    await loginPage.goto();
    
    // Wait for the form to be loaded
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
    
    // Listen for response from login endpoint
    const loginResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 200
    );
    
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    
    // Wait for login response and verify it
    const loginResponse = await loginResponsePromise;
    const responseData = await loginResponse.json();
    expect(responseData.success).toBeTruthy();
    
    // Assert navigation and dashboard content
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });
  
  test('Błędne dane logowania pokazują komunikat błędu', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    
    // Act
    await loginPage.goto();
    
    // Wait for the form to be loaded
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
    
    // Listen for response from login endpoint
    const loginResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/login')
    );
    
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Wait for login response and verify error
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(401);
    
    // Assert error message is shown
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });
});
