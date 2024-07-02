import Buffer from 'buffer';
import TelegramBot from 'node-telegram-bot-api';
import { assetLogger, mainLogger } from "../utils/logger/logger.js";
import admin from './firebaseServer.js';
import { isServerPrimary } from '../index.js';

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
    }}
    else {
        mainLogger.info(`Server is not primary. Notification not sent.`);
    }
}

export const NotifyTelegram = (body) => {
    try {
        bot.sendMessage(channelId, body);
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        //console.log(error);
        assetLogger.error(`Failed to send notification to Telegram`);
    }
}

export const NotifyFirebase = async (title, body) => {
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

export const NotifyNewsClients = (title, body) => {
    //console.log(title, body);

    const newsTitle = JSON.stringify(body.title);
    const encodedTitle = Buffer.from(JSON.stringify(title)).toString('base64');
    // const base64 = Buffer.from(JSON.stringify(object)).toString('base64');

    console.table({ encodedTitle });

    try {
        const response = fetch('https://notifications.surajr.com.np/NepseNews', {
            method: 'POST',
            body: JSON.stringify(body.description),
            headers: {
                // 'Actions': `http, View News, ${body.link}, clear=true`,
                'Attach': body.img_url,
                'Click': body.link,
                'Title': `=?UTF-8?B?8J+HqfCfh6o=?=${encodedTitle}`,
                'Priority': 'urgent',
                'Tags': 'loudspeaker'
            }
        });

        response.then(res => {
            if (!res.ok) {
                console.error(`Failed to send notification to Nepse news clients. Status: ${res.status}`);
            }
        }).catch(error => {
            console.error(`Error sending notification: ${error.message}`);
        });
    } catch (error) {
        console.error(`Error at NotifyNewsClients: ${error.message}`);
    }
};


export const NotifyNepseIndexClients = (title, body) => {
    try {
        const response = fetch('https://notifications.surajr.com.np/NepseIndex', {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/json',
                'Title': title,
                'Priority': 'urgent',
                'Tags': 'loudspeaker'
            }
        });

        if (!response.ok) {
            assetLogger.error(`Failed to send notification to Nepse index clients`);
        }
    } catch (error) {
        assetLogger.error(`Error at NotifyNepseClients: ${error.message}`);
    }
};

