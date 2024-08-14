import { MongoClient } from 'mongodb';

async function testMongoConnection() {
    const url = 'mongodb://AdminSuraj:ksjnsjkfnskjfnnjjkdfsefnekfnefsjkjn12jnfekjkfmmnsfniiqwonfs9@mongo:27017';
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log('Connected successfully to MongoDB server');
        const databasesList = await client.db().admin().listDatabases();
        console.log('Databases:');
        databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    } catch (err) {
        console.error('An error occurred while connecting to MongoDB:', err);
    } finally {
        await client.close();
    }
}

testMongoConnection();
