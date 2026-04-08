import { expect, test } from '@playwright/test';
import { ensureTechnicianProfileCompleted, loginAsTechnician } from './helpers/auth';

test.describe.serial('Technician Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTechnician(page);
    await ensureTechnicianProfileCompleted(page);
  });

  test('dashboard loads and shows technician work areas', async ({ page }) => {
    await expect(page.getByTestId('technician-dashboard-page')).toBeVisible();
    await expect(page.getByTestId('technician-dashboard-refresh')).toBeVisible();
    await expect(page.getByTestId('technician-tab-active')).toBeVisible();
    await expect(page.getByTestId('technician-tab-open')).toBeVisible();
    await expect(page.getByTestId('technician-tab-history')).toBeVisible();
    await expect(page.getByTestId('technician-tab-reviews')).toBeVisible();
    await expect(page.getByTestId('technician-tab-leaderboard')).toBeVisible();
  });

  test('technician can view and update profile screens', async ({ page }) => {
    await page.goto('/technician/profile');
    await expect(page.getByTestId('technician-profile-page')).toBeVisible();
    await expect(page.getByTestId('technician-profile-tabs')).toBeVisible();

    await page.getByTestId('technician-profile-tab-technician').click();
    await expect(page.locator('#specialty')).toBeVisible();

    await page.locator('#specialty').fill('Kỹ thuật điện lạnh và điện nước');
    await page.locator('#experienceYears').fill('5');
    await page.locator('#workDescription').fill('Xử lý sự cố điện lạnh, điện nước và bảo trì định kỳ.');
    await page.locator('#baseLocation').fill('Đống Đa, Hà Nội');
    await page.locator('#availableFrom').fill('08:30');
    await page.locator('#availableTo').fill('18:30');
    await page.getByTestId('technician-profile-save').click();

    await expect(page.getByTestId('technician-profile-page')).toBeVisible();
  });

  test('technician can manage bank info and wallet page', async ({ page }) => {
    await page.goto('/technician/wallet');
    await expect(page.getByTestId('technician-wallet-page')).toBeVisible();
    await expect(page.getByTestId('technician-wallet-refresh')).toBeVisible();

    const bankTrigger = page
      .getByTestId('technician-wallet-edit-bank')
      .or(page.getByTestId('technician-wallet-open-bank'));
    await bankTrigger.first().click();

    await page.locator('#bankName').fill('Vietcombank');
    await page.locator('#bankAccountNumber').fill('0123456789');
    await page.locator('#bankAccountHolder').fill('NGUYEN VAN THO');
    await page.getByTestId('technician-wallet-bank-submit').click();

    await expect(page.getByTestId('technician-wallet-page')).toBeVisible();
  });

  test('technician can open withdraw flow when balance allows', async ({ page }) => {
    await page.goto('/technician/wallet');
    await expect(page.getByTestId('technician-wallet-page')).toBeVisible();

    const withdrawButton = page.getByTestId('technician-wallet-open-withdraw');
    await expect(withdrawButton).toBeVisible();

    if (await withdrawButton.isDisabled()) {
      await expect(withdrawButton).toBeDisabled();
      return;
    }

    await withdrawButton.click();
    await page.locator('#amount').fill('10000');
    await page.getByTestId('technician-wallet-withdraw-submit').click();
    await expect(page.getByTestId('technician-wallet-page')).toBeVisible();
  });

  test('technician can inspect open booking board', async ({ page }) => {
    await expect(page.getByTestId('technician-tab-open')).toBeVisible();
    await page.getByTestId('technician-tab-open').click();

    const claimButtons = page.locator('[data-testid^="claim-booking-"]');
    const count = await claimButtons.count();

    if (count > 0) {
      await expect(claimButtons.first()).toBeVisible();
    } else {
      await expect(page.getByTestId('technician-dashboard-page')).toBeVisible();
    }
  });
});
