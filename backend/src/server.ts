import app from './app';
import { getDb } from './database/client';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Inicializar DB (crea tablas si no existen)
getDb();
console.log('✅ Base de datos inicializada');

app.listen(PORT, () => {
  console.log(`🍕 Piacere API corriendo en http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
