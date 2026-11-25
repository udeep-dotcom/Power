// Recordings made in the Voice Studio, kept on this device (IndexedDB) and played instead of
// text-to-speech straight away. Nothing leaves the device unless a grown-up exports it.

const DB = 'akshar-yatra-voice';
const STORE = 'clips';

export interface LocalClip { id: string; blob: Blob; ms: number; at: number }

let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  dbp ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no indexedDB'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function run<R>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<R>): Promise<R> {
  return db().then((d) => new Promise<R>((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

export async function localIds(): Promise<string[]> {
  try { return (await run('readonly', (s) => s.getAllKeys())) as string[]; } catch { return []; }
}
export async function getLocal(id: string): Promise<LocalClip | null> {
  try { return (await run('readonly', (s) => s.get(id))) ?? null; } catch { return null; }
}
export async function allLocal(): Promise<LocalClip[]> {
  try { return await run('readonly', (s) => s.getAll()); } catch { return []; }
}
export function putLocal(c: LocalClip): Promise<unknown> { return run('readwrite', (s) => s.put(c)); }
export function deleteLocal(id: string): Promise<unknown> { return run('readwrite', (s) => s.delete(id)); }
export function clearLocal(): Promise<unknown> { return run('readwrite', (s) => s.clear()); }
