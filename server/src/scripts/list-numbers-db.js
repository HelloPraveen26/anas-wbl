const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log('DB Config:', {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USERNAME,
    db: process.env.DATABASE_NAME
});

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'voice_assistant_db',
    synchronize: false,
    connectTimeoutMS: 5000,
});

async function listNumbers() {
    console.log('Connecting to database...');
    try {
        await AppDataSource.initialize();
        console.log('Connected! Querying registered_number table...');
        const numbers = await AppDataSource.query('SELECT * FROM registered_number');
        console.log('Found', numbers.length, 'numbers:');
        console.log(JSON.stringify(numbers, null, 2));
        await AppDataSource.destroy();
    } catch (err) {
        console.error('Database Error:', err.message);
        process.exit(1);
    }
}

listNumbers();
