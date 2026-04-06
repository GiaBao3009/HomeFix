export const DEFAULT_PASSWORD = '123456';

export const USERS = {
  technician: {
    email: 'tech1@homefix.com',
    password: DEFAULT_PASSWORD,
    role: 'TECHNICIAN',
  },
  technicianAlt: {
    email: 'tech2@homefix.com',
    password: DEFAULT_PASSWORD,
    role: 'TECHNICIAN',
  },
  admin: {
    email: 'admin@homefix.com',
    password: DEFAULT_PASSWORD,
    role: 'ADMIN',
  },
  customer: {
    email: 'customer@homefix.com',
    password: DEFAULT_PASSWORD,
    role: 'CUSTOMER',
  },
};

export async function login(page, credentials = USERS.technician) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(credentials.email);
  await page.getByTestId('login-password').fill(credentials.password);
  await page.getByTestId('login-submit').click();
}

export async function loginAsTechnician(page, overrides = {}) {
  await login(page, { ...USERS.technician, ...overrides });
  await page.waitForURL('**/technician/dashboard');
}

export async function loginAsAdmin(page, overrides = {}) {
  await login(page, { ...USERS.admin, ...overrides });
  await page.waitForURL('**/admin/dispatch');
}

export async function loginAsCustomer(page, overrides = {}) {
  await login(page, { ...USERS.customer, ...overrides });
  await page.waitForURL(/\/$/);
}

export async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
  await page.goto('/login');
}

export async function ensureTechnicianProfileCompleted(page) {
  const profileForm = page.getByTestId('technician-complete-profile-form');
  if (!(await profileForm.isVisible().catch(() => false))) {
    return;
  }

  await page.locator('#specialty').fill('Thợ điện lạnh đa năng');
  await page.locator('#experienceYears').fill('3');
  await page.locator('#citizenId').fill(`07920${Date.now().toString().slice(-6)}`);
  await page.locator('#workDescription').fill('Bảo trì, sửa chữa và hỗ trợ xử lý sự cố tại nhà.');
  await page.locator('#baseLocation').fill('Cầu Giấy, Hà Nội');
  await page.locator('#availableFrom').fill('08:00');
  await page.locator('#availableTo').fill('18:00');

  const technicianType = page.locator('#technicianType');
  await technicianType.click();
  await page.getByRole('option').filter({ hasText: /thợ chính|main/i }).first().click();

  const categorySelector = page.locator('#categoryIds');
  await categorySelector.click();
  await page.getByRole('option').first().click();
  await page.keyboard.press('Escape');

  await page.getByTestId('technician-profile-submit').click();
  await profileForm.waitFor({ state: 'hidden' });
}
