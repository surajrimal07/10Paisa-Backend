import {notifyClients } from './websocket.js';

const demoNotification = {
  title: 'Demo Notification',
  message: 'This is a demo notification message.',
  timestamp: new Date().toISOString(),
};

notifyClients(demoNotification);
