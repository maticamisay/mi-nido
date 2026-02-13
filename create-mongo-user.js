const mongoose = require('./backend/node_modules/mongoose');

async function setupDatabase() {
    try {
        // Conectar como admin
        console.log('🐣 Intentando conectar a MongoDB como admin...');
        await mongoose.connect('mongodb://admin:admin@localhost:27017/admin');
        
        console.log('✅ Conectado a MongoDB como admin');
        
        // Cambiar a la base de datos mi_nido
        const db = mongoose.connection.db.admin();
        
        // Crear usuario para mi_nido
        const createUserResult = await db.command({
            createUser: 'minido',
            pwd: 'miNido2026Secure!',
            roles: [{role: 'readWrite', db: 'mi_nido'}]
        });
        
        console.log('✅ Usuario "minido" creado:', createUserResult);
        
    } catch (error) {
        if (error.codeName === 'DuplicateKey' || error.message.includes('already exists')) {
            console.log('ℹ️ Usuario "minido" ya existe');
        } else {
            console.error('❌ Error:', error.message);
        }
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

setupDatabase();