import { expect, test } from '@playwright/test';
import {
  login,
  loginAsAdmin,
  loginAsCustomer,
  loginAsTechnician,
  USERS,
  ensureTechnicianProfileCompleted,
} from './helpers/auth';

function formItemError(page, locator) {
  return page.locator('.ant-form-item').filter({ has: locator }).locator('.ant-form-item-explain-error');
}

async function openProfileTab(page, testId) {
  await page.goto('/technician/profile');
  await expect(page.getByTestId('technician-profile-page')).toBeVisible();
  await page.getByTestId(testId).click();
}

async function openTechnicianProfileTab(page) {
  await openProfileTab(page, 'technician-profile-tab-technician');
  await expect(page.locator('#specialty')).toBeVisible();
}

async function openPasswordTab(page) {
  await openProfileTab(page, 'technician-profile-tab-password');
  await expect(page.locator('#oldPassword')).toBeVisible();
}

async function openBankTab(page) {
  await openProfileTab(page, 'technician-profile-tab-bank');
  await expect(page.locator('#bankName')).toBeVisible();
}

async function openWalletBankModal(page) {
  await page.goto('/technician/wallet');
  await expect(page.getByTestId('technician-wallet-page')).toBeVisible();
  const trigger = page
    .getByTestId('technician-wallet-edit-bank')
    .or(page.getByTestId('technician-wallet-open-bank'));
  await trigger.first().click();
  await expect(page.locator('#bankName')).toBeVisible();
}

async function openSelectByInputId(page, inputId) {
  const field = page.locator('.ant-form-item').filter({ has: page.locator(`#${inputId}`) });
  await field.locator('.ant-select-selector').click({ force: true });
}

test.describe('Technician Route Guards', () => {
  const technicianRoutes = [
    '/technician/dashboard',
    '/technician/profile',
    '/technician/wallet',
  ];

  technicianRoutes.forEach((route) => {
    test(`unauthenticated user is redirected from ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login$/);
    });
  });

  technicianRoutes.forEach((route) => {
    test(`customer cannot access ${route}`, async ({ page }) => {
      await loginAsCustomer(page);
      await page.goto(route);
      await expect(page).toHaveURL(/\/$/);
    });
  });

  technicianRoutes.forEach((route) => {
    test(`admin cannot access ${route}`, async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(route);
      await expect(page).toHaveURL(/\/$/);
    });
  });

  technicianRoutes.forEach((route) => {
    test(`technician account 1 can access ${route}`, async ({ page }) => {
      await loginAsTechnician(page);
      await ensureTechnicianProfileCompleted(page);
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, '\\/')}$`));
    });
  });

  technicianRoutes.forEach((route) => {
    test(`technician account 2 can access ${route}`, async ({ page }) => {
      await loginAsTechnician(page, USERS.technicianAlt);
      await ensureTechnicianProfileCompleted(page);
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, '\\/')}$`));
    });
  });
});

test.describe('Authentication Redirects', () => {
  test('technician login redirects to technician dashboard', async ({ page }) => {
    await login(page, USERS.technician);
    await expect(page).toHaveURL(/\/technician\/dashboard$/);
  });

  test('admin login redirects to admin dispatch', async ({ page }) => {
    await login(page, USERS.admin);
    await expect(page).toHaveURL(/\/admin\/dispatch$/);
  });

  test('customer login redirects to home page', async ({ page }) => {
    await login(page, USERS.customer);
    await expect(page).toHaveURL(/\/$/);
  });

  test('invalid login shows error alert', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('tech1@homefix.com');
    await page.getByTestId('login-password').fill('wrong-password');
    await page.getByTestId('login-submit').click();
    await expect(page.locator('.ant-alert')).toBeVisible();
  });
});

test.describe('Technician Dashboard Matrix', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTechnician(page);
    await ensureTechnicianProfileCompleted(page);
  });

  test('dashboard page root is visible', async ({ page }) => {
    await expect(page.getByTestId('technician-dashboard-page')).toBeVisible();
  });

  test('dashboard refresh button is visible', async ({ page }) => {
    await expect(page.getByTestId('technician-dashboard-refresh')).toBeVisible();
  });

  test('profile completion modal is not shown after setup', async ({ page }) => {
    await expect(page.getByTestId('technician-complete-profile-form')).toBeHidden();
  });

  [
    'technician-tab-active',
    'technician-tab-open',
    'technician-tab-history',
    'technician-tab-reviews',
    'technician-tab-leaderboard',
  ].forEach((tabId) => {
    test(`dashboard shows tab label ${tabId}`, async ({ page }) => {
      await expect(page.getByTestId(tabId)).toBeVisible();
    });
  });

  [
    'technician-tab-active',
    'technician-tab-open',
    'technician-tab-history',
    'technician-tab-reviews',
    'technician-tab-leaderboard',
  ].forEach((tabId) => {
    test(`dashboard can activate ${tabId}`, async ({ page }) => {
      const tabLabel = page.getByTestId(tabId);
      await tabLabel.click();
      await expect(tabLabel.locator('xpath=ancestor::*[@role="tab"][1]')).toHaveAttribute('aria-selected', 'true');
    });
  });

  test('dashboard active tab shows content area', async ({ page }) => {
    await page.getByTestId('technician-tab-active').click();
    await expect(page.locator('.ant-table-wrapper').first()).toBeVisible();
  });

  test('dashboard open tab shows content area', async ({ page }) => {
    await page.getByTestId('technician-tab-open').click();
    await expect(page.locator('.ant-tabs-tabpane-active')).toBeVisible();
  });

  test('dashboard refresh keeps user on technician dashboard', async ({ page }) => {
    await page.getByTestId('technician-dashboard-refresh').click();
    await expect(page).toHaveURL(/\/technician\/dashboard$/);
  });
});

test.describe('Technician Profile Matrix', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTechnician(page);
    await ensureTechnicianProfileCompleted(page);
  });

  test('profile page root is visible', async ({ page }) => {
    await page.goto('/technician/profile');
    await expect(page.getByTestId('technician-profile-page')).toBeVisible();
  });

  test('profile tabs container is visible', async ({ page }) => {
    await page.goto('/technician/profile');
    await expect(page.getByTestId('technician-profile-tabs')).toBeVisible();
  });

  [
    'technician-profile-tab-account',
    'technician-profile-tab-technician',
    'technician-profile-tab-password',
    'technician-profile-tab-bank',
  ].forEach((tabId) => {
    test(`profile shows tab ${tabId}`, async ({ page }) => {
      await page.goto('/technician/profile');
      await expect(page.getByTestId(tabId)).toBeVisible();
    });
  });

  [
    'technician-profile-tab-account',
    'technician-profile-tab-technician',
    'technician-profile-tab-password',
    'technician-profile-tab-bank',
  ].forEach((tabId) => {
    test(`profile can switch to ${tabId}`, async ({ page }) => {
      await page.goto('/technician/profile');
      const tabLabel = page.getByTestId(tabId);
      await tabLabel.click();
      await expect(tabLabel.locator('xpath=ancestor::*[@role="tab"][1]')).toHaveAttribute('aria-selected', 'true');
    });
  });

  [
    '#fullName',
    '#email',
    '#phone',
    '#address',
  ].forEach((selector) => {
    test(`account tab shows field ${selector}`, async ({ page }) => {
      await openProfileTab(page, 'technician-profile-tab-account');
      await expect(page.locator(selector)).toBeVisible();
    });
  });

  [
    '#specialty',
    '#categoryIds',
    '#experienceYears',
    '#workDescription',
    '#citizenId',
    '#technicianType',
    '#baseLocation',
    '#availableFrom',
    '#availableTo',
  ].forEach((selector) => {
    test(`technician tab shows field ${selector}`, async ({ page }) => {
      await openTechnicianProfileTab(page);
      await expect(page.locator(selector)).toBeVisible();
    });
  });

  [
    '#oldPassword',
    '#newPassword',
    '#confirmPassword',
  ].forEach((selector) => {
    test(`password tab shows field ${selector}`, async ({ page }) => {
      await openPasswordTab(page);
      await expect(page.locator(selector)).toBeVisible();
    });
  });

  [
    '#bankName',
    '#bankAccountNumber',
    '#bankAccountHolder',
  ].forEach((selector) => {
    test(`bank tab shows field ${selector}`, async ({ page }) => {
      await openBankTab(page);
      await expect(page.locator(selector)).toBeVisible();
    });
  });

  test('account tab validates required fullName', async ({ page }) => {
    await openProfileTab(page, 'technician-profile-tab-account');
    const field = page.locator('#fullName');
    await field.fill('');
    await page.getByTestId('technician-account-submit').click();
    await expect(formItemError(page, field)).toBeVisible();
  });

  [
    '#specialty',
    '#experienceYears',
    '#workDescription',
    '#citizenId',
    '#baseLocation',
    '#availableFrom',
    '#availableTo',
  ].forEach((selector) => {
    test(`technician tab validates required field ${selector}`, async ({ page }) => {
      await openTechnicianProfileTab(page);
      const field = page.locator(selector);
      if (selector === '#categoryIds') {
        const categoryField = page.locator('.ant-form-item').filter({ has: field });
        const clearButton = categoryField.locator('.ant-select-clear');
        if (await clearButton.isVisible().catch(() => false)) {
          await clearButton.click({ force: true });
        }
        await page.getByTestId('technician-profile-save').click();
      } else {
        await field.fill('');
        await page.getByTestId('technician-profile-save').click();
      }
      await expect(formItemError(page, field)).toBeVisible();
    });
  });

  test('technician tab validates required field #categoryIds', async ({ page }) => {
    await openTechnicianProfileTab(page);
    const field = page.locator('#categoryIds');
    const categoryField = page.locator('.ant-form-item').filter({ has: field });
    await categoryField.hover();
    const removeIcons = categoryField.locator('.ant-select-selection-item-remove');
    while (await removeIcons.count()) {
      await removeIcons.first().click({ force: true });
    }
    await page.getByTestId('technician-profile-save').click();
    await expect(categoryField).toHaveClass(/ant-form-item-has-error/);
  });

  [
    '#bankName',
    '#bankAccountNumber',
    '#bankAccountHolder',
  ].forEach((selector) => {
    test(`bank tab validates required field ${selector}`, async ({ page }) => {
      await openBankTab(page);
      const field = page.locator(selector);
      await field.fill('');
      await page.getByTestId('technician-bank-submit').click();
      await expect(formItemError(page, field)).toBeVisible();
    });
  });

  test('password tab validates required old password', async ({ page }) => {
    await openPasswordTab(page);
    const field = page.locator('#oldPassword');
    await field.fill('');
    await page.getByTestId('technician-password-submit').click();
    await expect(formItemError(page, field)).toBeVisible();
  });

  test('password tab validates required new password', async ({ page }) => {
    await openPasswordTab(page);
    const field = page.locator('#newPassword');
    await field.fill('');
    await page.getByTestId('technician-password-submit').click();
    await expect(formItemError(page, field)).toBeVisible();
  });

  test('password tab validates required confirm password', async ({ page }) => {
    await openPasswordTab(page);
    const field = page.locator('#confirmPassword');
    await field.fill('');
    await page.getByTestId('technician-password-submit').click();
    await expect(formItemError(page, field)).toBeVisible();
  });

  test('password tab validates new password minimum length', async ({ page }) => {
    await openPasswordTab(page);
    const field = page.locator('#newPassword');
    await page.locator('#oldPassword').fill('123456');
    await field.fill('123');
    await page.locator('#confirmPassword').fill('123');
    await page.getByTestId('technician-password-submit').click();
    await expect(formItemError(page, field)).toBeVisible();
  });

  test('password tab validates password confirmation mismatch', async ({ page }) => {
    await openPasswordTab(page);
    const field = page.locator('#confirmPassword');
    await page.locator('#oldPassword').fill('123456');
    await page.locator('#newPassword').fill('1234567');
    await field.fill('7654321');
    await page.getByTestId('technician-password-submit').click();
    await expect(formItemError(page, field)).toBeVisible();
  });

  test('technician tab shows supervisor field for assistant type', async ({ page }) => {
    await openTechnicianProfileTab(page);
    const technicianType = page.locator('#technicianType');
    await openSelectByInputId(page, 'technicianType');
    await technicianType.press('ArrowDown');
    await technicianType.press('Enter');
    await expect(page.locator('#supervisingTechnicianId')).toBeVisible();
  });

  test('technician tab hides supervisor field for main type', async ({ page }) => {
    await openTechnicianProfileTab(page);
    await expect(page.locator('#supervisingTechnicianId')).toBeHidden();
  });

  test('technician tab auto-assign switch can toggle', async ({ page }) => {
    await openTechnicianProfileTab(page);
    const toggle = page.getByRole('switch').first();
    const initial = await toggle.getAttribute('aria-checked');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', initial === 'true' ? 'false' : 'true');
  });

  test('account tab can submit profile updates', async ({ page }) => {
    await openProfileTab(page, 'technician-profile-tab-account');
    const phoneField = page.locator('#phone');
    const addressField = page.locator('#address');
    await phoneField.fill('0912345678');
    await addressField.fill('Cầu Giấy, Hà Nội');
    await page.getByTestId('technician-account-submit').click();
    await expect(page.getByTestId('technician-profile-page')).toBeVisible();
  });

  test('technician tab can submit profile updates', async ({ page }) => {
    await openTechnicianProfileTab(page);
    await page.locator('#specialty').fill('Kỹ thuật tổng hợp');
    await page.locator('#experienceYears').fill('5');
    await page.locator('#workDescription').fill('Bảo trì điện lạnh và điện nước định kỳ.');
    await page.locator('#baseLocation').fill('Ba Đình, Hà Nội');
    await page.locator('#availableFrom').fill('08:30');
    await page.locator('#availableTo').fill('18:30');
    await page.getByTestId('technician-profile-save').click();
    await expect(page.getByTestId('technician-profile-page')).toBeVisible();
  });
});

test.describe('Technician Wallet Matrix', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTechnician(page);
    await ensureTechnicianProfileCompleted(page);
  });

  test('wallet page root is visible', async ({ page }) => {
    await page.goto('/technician/wallet');
    await expect(page.getByTestId('technician-wallet-page')).toBeVisible();
  });

  test('wallet refresh button is visible', async ({ page }) => {
    await page.goto('/technician/wallet');
    await expect(page.getByTestId('technician-wallet-refresh')).toBeVisible();
  });

  test('wallet shows summary cards', async ({ page }) => {
    await page.goto('/technician/wallet');
    await expect(page.locator('[data-testid="technician-wallet-page"] .ant-card')).toHaveCount(8);
  });

  test('wallet shows history tables', async ({ page }) => {
    await page.goto('/technician/wallet');
    const sections = page.locator('[data-testid="technician-wallet-page"] .ant-table-wrapper, [data-testid="technician-wallet-page"] .ant-empty');
    expect(await sections.count()).toBeGreaterThanOrEqual(2);
  });

  test('wallet bank modal opens from available trigger', async ({ page }) => {
    await openWalletBankModal(page);
    await expect(page.locator('.ant-modal-content')).toBeVisible();
  });

  test('wallet bank modal can be cancelled', async ({ page }) => {
    await openWalletBankModal(page);
    await page.locator('.ant-modal .ant-btn-default').first().click();
    await expect(page.locator('#bankName')).toBeHidden();
  });

  test('wallet bank modal can submit bank info', async ({ page }) => {
    await openWalletBankModal(page);
    await page.locator('#bankName').fill('Vietcombank');
    await page.locator('#bankAccountNumber').fill('0123456789');
    await page.locator('#bankAccountHolder').fill('NGUYEN VAN THO');
    await page.getByTestId('technician-wallet-bank-submit').click();
    await expect(page.getByTestId('technician-wallet-page')).toBeVisible();
  });

  test('wallet withdraw button is visible', async ({ page }) => {
    await page.goto('/technician/wallet');
    await expect(page.getByTestId('technician-wallet-open-withdraw')).toBeVisible();
  });

  test('wallet withdraw button is disabled or opens modal', async ({ page }) => {
    await page.goto('/technician/wallet');
    const withdrawButton = page.getByTestId('technician-wallet-open-withdraw');
    if (await withdrawButton.isDisabled()) {
      await expect(withdrawButton).toBeDisabled();
    } else {
      await withdrawButton.click();
      await expect(page.locator('#amount')).toBeVisible();
    }
  });
});
