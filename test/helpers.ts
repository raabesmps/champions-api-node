import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * Cada arquivo de teste roda num processo próprio e grava numa pasta temporária,
 * começando sempre da semente em data/seed. Os dados reais em data/ nunca são tocados.
 */
export function useTempData(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'champions-'));
  process.env.DATA_DIR = dir;
  process.env.SEED_DIR = resolve('data', 'seed');
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

export const validPlayer = (overrides: Record<string, unknown> = {}) => ({
  name: 'Rodrygo',
  clubId: 1,
  nationality: 'Brasil',
  position: 'Atacante',
  statistics: { overall: 85, pace: 89, shooting: 82, passing: 80, dribbling: 87, defending: 35, physical: 66 },
  ...overrides,
});
