// import express from 'express';
// import http from 'http';
// import path from 'path';
// import { Server } from 'socket.io';
// import { fileURLToPath } from 'url';

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: '*',
//         methods: ['GET', 'POST']
//     }
// });

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

// io.on('connection', (socket) => {
//     console.log('Socket ID:', socket.id);
//     console.log('Handshake query:', socket.handshake.query);
//     console.log('Handshake headers:', socket.handshake.headers);

//     socket.on('disconnect', () => {
//         console.log('user disconnected');
//     });
// });

// server.listen(3000, () => {
//     console.log('listening on *:3000');
// });


