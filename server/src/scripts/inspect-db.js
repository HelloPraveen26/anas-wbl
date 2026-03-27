const { DataSource } = require('typeorm');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: false,
});

async function inspectRegisteredNumbers() {
    await AppDataSource.initialize();

    console.log('Inspecting all registered numbers...');
    const numbers = await AppDataSource.query('SELECT * FROM registered_number');
    console.log(JSON.stringify(numbers, null, 2));

    await AppDataSource.destroy();
}

inspectRegisteredNumbers().catch(console.error);
