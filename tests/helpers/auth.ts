import { Page, expect } from '@playwright/test';

export const TEST_USERS = {
  Administrador: { email: 'admin@mafort.pe', password: 'mafort' },
  Ventas: { email: 'ventas@mafort.pe', password: 'mafort' },
  Tecnico: { email: 'juan.cordova@materiagris.pe', password: 'mafort' },
  Supervisor: { email: 'supervisor@mafort.pe', password: 'mafort' },
  Cliente: { email: 'cliente@mafort.pe', password: 'mafort' },
} as const;

export type Role = keyof typeof TEST_USERS;

export const ROLE_MODULES: Record<Role, string[]> = {
  Administrador: ['Dashboard', 'Operaciones', 'Gestión de OT', 'Comercial', 'Portal de Ventas', 'Técnicos', 'Supervisión', 'Portal Cliente', 'Administración'],
  Ventas: ['Dashboard', 'Operaciones', 'Gestión de OT', 'Comercial', 'Portal de Ventas'],
  Tecnico: ['Técnicos'],
  Supervisor: ['Supervisión', 'Operaciones', 'Gestión de OT'],
  Cliente: ['Dashboard', 'Operaciones', 'Portal Cliente'],
};

/** Mapea el displayLabel del sidebar (única clave visible) al id de módulo. */
export const MODULE_LABEL_TO_ID: Record<string, string> = {
  'Dashboard': 'Dashboard',
  'Operaciones': 'Monitoreo',
  'Gestión de OT': 'GestionOTs',
  'Comercial': 'ClientesContratos',
  'Portal de Ventas': 'Ventas',
  'Técnicos': 'Tecnico',
  'Supervisión': 'Supervisor',
  'Portal Cliente': 'Cliente',
  'Administración': 'Usuarios',
};

/** Llena el formulario de login manualmente y espera el sidebar. */
export async function login(page: Page, role: Role): Promise<void> {
  const user = TEST_USERS[role];
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  }).catch(() => {});
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('nombre@gestia.com').fill(user.email);
  await page.getByPlaceholder('••••••••').fill(user.password);
  await page.getByRole('button', { name: /Acceder al sistema/i }).click();

  // Espera que el sidebar (identifica sesión iniciada) aparezca
  await expect(page.locator('#sidebar-panel')).toBeVisible({ timeout: 25_000 });
}

/** Navega a un módulo desde el sidebar usando su displayLabel. */
export async function goToModule(page: Page, moduleLabel: string): Promise<void> {
  await page.locator('#sidebar-panel nav').getByRole('button', { name: moduleLabel, exact: false }).first().click();
}

/** Registra y devuelve los errores de consola del navegador (para assert de "zero console.error"). */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}
