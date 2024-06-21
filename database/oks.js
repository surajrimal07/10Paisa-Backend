import mongoose from 'mongoose';

const dbUrl = 'mongodb://tenpaisa:nfkjnjkdjhjkweruonnmxcdj3@db.surajr.com.np:27017/paisa?retryWrites=true&w=majority';

const clientOptions = {
    minPoolSize: 10,
    maxPoolSize: 100,
    compressors: ["zstd"],
    connectTimeoutMS: 60000,
    socketTimeoutMS: 30000,
    family: 4
};

async function testDatabaseConnection() {
    try {
        await mongoose.connect(dbUrl, clientOptions);
        console.log('Connected to the database');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

testDatabaseConnection();
