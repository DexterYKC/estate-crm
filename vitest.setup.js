import path from 'path';
import { randomUUID } from 'crypto';

// Chaque fichier de test reçoit sa propre base SQLite jetable : évite les conflits
// SQLITE_BUSY quand plusieurs fichiers de test tournent en parallèle sur le même fichier.
const TEST_DB = path.join(process.cwd(), 'data', `test-${randomUUID()}.db`);
process.env.TURSO_DATABASE_URL = `file:${TEST_DB}`;
