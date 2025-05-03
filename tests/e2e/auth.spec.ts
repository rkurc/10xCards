import { test, expect } from '@playwright/test';
import { LoginPage } from './models/LoginPage';
import { DashboardPage } from './models/DashboardPage';

test.describe('Autentykacja', () => {
  const TEST_USER = {
    email: process.env.E2E_USERNAME || 'piotr.supa@test.org',
    password: process.env.E2E_PASSWORD || '@T3stP4ssw0rd!@#'
  };

  test('Poprawne logowanie przekierowuje do dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Navigate to login
    await loginPage.goto();
    
    // Wait for the login form to be ready
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
    
    // Listen for successful login response
    const loginResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login') && response.status() === 200
    );
    
    // Perform login
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    
    // Wait for successful login response
    const loginResponse = await loginResponsePromise;
    const responseData = await loginResponse.json();
    expect(responseData.success).toBeTruthy();
    
    // Wait for navigation and dashboard content
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await dashboardPage.waitForPageLoad();
    await expect(dashboardPage.welcomeMessage).toBeVisible({ timeout: 10000 });
  });

  test('Błędne dane logowania pokazują komunikat błędu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    
    // Listen for failed login response
    const loginResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login')
    );
    
    // Try to login with invalid credentials
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Verify error response
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(401);
    
    // Wait for error toast to appear
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });
    
    // Verify we stay on login page
    await expect(page).toHaveURL(/.*login/);
  });
});
