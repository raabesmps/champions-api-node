import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

/*
 * ARMAZENAMENTO EM ARQUIVO JSON
 * - Na primeira leitura, se data/<nome>.json não existe, ele é criado a partir de data/seed/<nome>.json.
 * - Gravações entram numa fila (uma por vez) e são atômicas: escreve num .tmp e renomeia,
 *   então uma queda no meio da gravação nunca deixa o arquivo pela metade.
 * - Os dados ficam em memória depois da primeira leitura e sobrevivem ao reinício do servidor.
 */

export function dataDir(): string {
  return resolve(process.env.DATA_DIR ?? 'data');
}

export function seedDir(): string {
  return resolve(process.env.SEED_DIR ?? join('data', 'seed'));
}

export interface JsonStore<T> {
  read(): Promise<T[]>;
  /** Aplica uma alteração e grava. Alterações concorrentes rodam uma de cada vez. */
  update<R>(change: (items: T[]) => R | Promise<R>): Promise<R>;
}

export function createJsonStore<T>(name: string): JsonStore<T> {
  let cache: T[] | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  const file = () => join(dataDir(), `${name}.json`);

  async function load(): Promise<T[]> {
    if (cache) return cache;
    try {
      cache = JSON.parse(await readFile(file(), 'utf-8')) as T[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      await mkdir(dirname(file()), { recursive: true });
      await copyFile(join(seedDir(), `${name}.json`), file());
      cache = JSON.parse(await readFile(file(), 'utf-8')) as T[];
    }
    if (!Array.isArray(cache)) throw new Error(`${file()} não contém uma lista.`);
    return cache;
  }

  async function persist(items: T[]) {
    const tmp = `${file()}.${process.pid}.tmp`;
    await writeFile(tmp, `${JSON.stringify(items, null, 2)}\n`, 'utf-8');
    await rename(tmp, file());
  }

  return {
    async read() {
      return structuredClone(await load());
    },
    update(change) {
      const run = queue.then(async () => {
        const items = structuredClone(await load());
        const result = await change(items);
        await persist(items);
        cache = items;
        return result;
      });
      queue = run.catch(() => undefined); // um erro não trava a fila
      return run;
    },
  };
}
