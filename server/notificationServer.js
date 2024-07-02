import { Buffer } from 'buffer';
import TelegramBot from 'node-telegram-bot-api';
import { isServerPrimary } from '../index.js';
import { assetLogger, mainLogger } from "../utils/logger/logger.js";
import admin from './firebaseServer.js';

const token = '7010309940:AAGZDzq6CqqOEUxvgvtStqPtAtwfGX9svjg';
const channelId = '-1002235997071';

const bot = new TelegramBot(token, { polling: false });

export const SendNotification = (where = "all", title, body) => {
    if (isServerPrimary) {

        if (where === "Telegram") {

            NotifyNepseClients(title, body);
        } if (where === "ntfy") {
            NotifyNepseClients(title, body);


        } if (where === "all") {
            NotifyNepseClients(title, body);
            NotifyTelegram(body);
            // NotifyFirebase(title, body);
        }
        else {
            mainLogger.error(`Invalid notification type: ${where}`);
        }
    }
    else {
        mainLogger.info(`Server is not primary. Notification not sent.`);
    }
}

export const NotifyTelegram = (body) => {

    if (isServerPrimary) {
        try {
            bot.sendMessage(channelId, body);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            //console.log(error);
            assetLogger.error(`Failed to send notification to Telegram`);
        }
    }
}

export const NotifyFirebase = async (title, body) => {
    if (isServerPrimary) {
        try {
            const message = {
                notification: {
                    title: title,
                    body: body
                },
                topic: 'your-topic-name'
            };

            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
        } catch (error) {
            assetLogger.error(`Failed to send notification to Firebase: ${error.message}`);
        }
    }
};


//notify app clients using ntfy
export const NotifyNepseClients = (title, body) => {
    try {
        const response = fetch('https://notifications.surajr.com.np/NepseAlerts', {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/json',
                'Title': title,
                'Priority': 'urgent',
                'Tags': 'warning'
            }
        });

        if (!response.ok) {
            assetLogger.error(`Failed to send notification to Nepse clients`);
        }
    } catch (error) {
        assetLogger.error(`Error at NotifyNepseClients: ${error.message}`);
    }
};

export async function NotifyNewsClients(title, body) {
    const encodedTitle = Buffer.from(title).toString('base64');

    if (isServerPrimary) {
        try {
            await fetch('https://notifications.surajr.com.np/NepseNews', {
                method: 'POST',
                body: body.description,
                headers: {
                    'Attach': body.img_url,
                    'Click': body.link,
                    "label": "Close door",
                    'Actions': `view, Open News, ${body.link}, clear=true`,
                    'Title': `=?UTF-8?B?${encodedTitle}?=`,
                    'Priority': 'urgent',
                    'Tags': 'loudspeaker'
                }
            });

        } catch (error) {
            console.error(`Error at NotifyNewsClients: ${error.message}`);
        }
    }
}

export const NotifyNepseIndexClients = (title, body) => {

    if (isServerPrimary) {
        try {
            fetch('https://notifications.surajr.com.np/NepseIndex', {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/json',
                    'Title': title,
                    'Priority': 'urgent',
                    'Tags': 'loudspeaker'
                }
            });
        } catch (error) {
            assetLogger.error(`Error at NotifyNepseClients: ${error.message}`);
        }
    }
};

