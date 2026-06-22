import { Database } from 'better-sqlite3';

export function toggleActive(db: any, table: string, id: number | string): { message: string; is_active: number } {
  const row = db.prepare(`SELECT is_active FROM ${table} WHERE id = ?`).get(id) as any;
  if (!row) {
    throw new Error('Registro no encontrado');
  }
  const nextStatus = row.is_active === 1 ? 0 : 1;
  db.prepare(`UPDATE ${table} SET is_active = ? WHERE id = ?`).run(nextStatus, id);
  return {
    message: nextStatus === 1 ? 'Activo' : 'Ocultado',
    is_active: nextStatus
  };
}