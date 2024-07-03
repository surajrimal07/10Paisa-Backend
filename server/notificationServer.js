/* eslint-disable no-undef */
import { Buffer } from 'buffer';
import TelegramBot from 'node-telegram-bot-api';
import { isServerPrimary } from '../index.js';
import { assetLogger, mainLogger } from "../utils/logger/logger.js";
import admin from './firebaseServer.js';

const token = process.env.TELEGRAM_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const bot = new TelegramBot(token, { polling: false });

export async function SendNotification(where = "all", title, body) {
    console.log('send notification triggered');

    if (isServerPrimary) {

        if (where === "Telegram") {

            await NotifyNepseClients(title, body);
        } if (where === "ntfy") {
            await NotifyNepseClients(title, body);


        } if (where === "all") {
            await NotifyNepseClients(title, body);
            await NotifyTelegram(body);
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

export async function NotifyTelegram(body) {
    if (isServerPrimary) {
        bot.sendMessage(channelId, body)
            .catch((error) => {
                assetLogger.error(`Failed to send notification , too many requests to Telegram: ${error.message}`);
            });
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
export async function NotifyNepseClients(title, body) {
    if (isServerPrimary) {
        try {
            await fetch('https://notifications.surajr.com.np/NepseAlerts', {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/json',
                    'Title': title,
                    'Priority': 'urgent',
                    'Tags': 'warning'
                }
            });
        } catch (error) {
            assetLogger.error(`Error at NotifyNepseClients: ${error.message}`);
        }
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

export const NotifyNepseIndexClients = async (title, body) => {

    if (isServerPrimary) {
        try {
            await fetch('https://notifications.surajr.com.np/NepseIndex', {
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

