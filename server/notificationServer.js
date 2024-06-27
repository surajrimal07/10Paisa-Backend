import TelegramBot from 'node-telegram-bot-api';
import { assetLogger, mainLogger } from "../utils/logger/logger.js";
//use firebase later

const token = '7010309940:AAGZDzq6CqqOEUxvgvtStqPtAtwfGX9svjg';
const channelId = '-4237057300';
const bot = new TelegramBot(token, { polling: false });

export const SendNotification = (where = "all", title, body) => {
    if (where === "Telegram") {

        NotifyNepseClients(title, body);
    } if (where === "ntfy") {
        NotifyNepseClients(title, body);


    } if (where === "all") {
        NotifyNepseClients(title, body);
        NotifyTelegram(body);
    }
    else {
        mainLogger.error(`Invalid notification type: ${where}`);
    }
}

export const NotifyTelegram = (body) => {
    try {
        bot.sendMessage(channelId, body);
    } catch (error) {
        //console.log(error);
        assetLogger.error(`Failed to send notification to Telegram`);
    }
}


//send notifications if fake buy sell orders are detected
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