// import mongoose from 'mongoose';

// const dbUrl = 'mongodb://tenpaisa:nfkjnjkdjhjkweruonnmxcdj3@db.surajr.com.np:27017/paisa?retryWrites=true&w=majority';

// const clientOptions = {
//     minPoolSize: 10,
//     maxPoolSize: 100,
//     compressors: ["zstd"],
//     connectTimeoutMS: 60000,
//     socketTimeoutMS: 30000,
//     family: 4
// };

// async function testDatabaseConnection() {
//     try {
//         await mongoose.connect(dbUrl, clientOptions);
//         console.log('Connected to the database');
//     } catch (error) {
//         console.error('Error connecting to the database:', error);
//     }
// }

// testDatabaseConnection();


// module.exports = {
//     apps: [
//         {
//             name: 'tenpaisa-backend',
//             script: 'index.js',
//             cwd: '/var/10paisa/10Paisa-Backend',
//             instances: 1,
//             autorestart: true,
//             exec_mode: "cluster",
//             watch: false,
//             max_memory_restart: '2G',
//             env: {
//                 NODE_ENV: 'production',
//                 PORT: 4000,
//             },
//         },
//         {
//             name: 'businessone-backend',
//             script: 'index.js',
//             cwd: '/var/10paisa/BusinessOne_backend',
//             instances: 1,
//             autorestart: true,
//             exec_mode: "cluster",
//             watch: false,
//             max_memory_restart: '1G',
//             env: {
//                 NODE_ENV: 'production',
//                 PORT: 5050,
//             },
//         },

//         {
//             name: 'simpleCICD',
//             script: 'server.js',
//             cwd: '/var/10paisa/simplecicd',
//             instances: 1,
//             autorestart: true,
//             exec_mode: "fork",
//             watch: false,
//             max_memory_restart: '200M',
//             env: {
//                 NODE_ENV: 'production',
//                 PORT: 6000,
//             },
//         },
//         {
//             name: 'nepseapi-fastapi',
//             interpreter: '/var/10paisa/myenv/bin/python3',
//             script: '/var/10paisa/NepseAPI/server.py',
//             cwd: '/var/10paisa/NepseAPI/',
//             instances: 1,
//             autorestart: true,
//             watch: true,
//             exec_mode: "fork",
//             max_memory_restart: '1G',
//             env: {
//                 PORT: 8000,
//             },
//         },
//         {
//             name: 'nepseapi-fastapi_backup',
//             interpreter: '/var/10paisa/myenv/bin/python3',
//             script: '/var/10paisa/NepseAPI_backup/server.py',
//             cwd: '/var/10paisa/NepseAPI_backup/',
//             instances: 1,
//             autorestart: true,
//             watch: true,
//             exec_mode: "fork",
//             max_memory_restart: '1G',
//             env: {
//                 PORT: 8005,
//             },
//         },
//         {
//             name: 'News Summarizer',
//             interpreter: '/var/10paisa/myenv/bin/python3',
//             script: '/var/10paisa/news_summarizer/server.py',
//             cwd: '/var/10paisa/news_summarizer/',
//             instances: 1,
//             autorestart: true,
//             watch: true,
//             exec_mode: "fork",
//             max_memory_restart: '200M',
//             env: {
//                 PORT: 8320,
//             },
//         },
//     ],
// };
