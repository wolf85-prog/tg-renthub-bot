require("dotenv").config();

//telegram api
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_API_TOKEN

const bot = new TelegramBot(token, {polling: true })

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const app = express();
const path = require('path')


// Certificate
const privateKey = fs.readFileSync('privkey.pem', 'utf8'); 
const certificate = fs.readFileSync('cert.pem', 'utf8'); 
const ca = fs.readFileSync('chain.pem', 'utf8'); 

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const httpsServer = https.createServer(credentials, app);

//-----------------------------------------------------------------------------------------
// START (обработка команд и входящих сообщени от пользователя)
//-----------------------------------------------------------------------------------------

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const firstname = msg.from.first_name
    const lastname = msg.from.last_name
    const username = msg.from.username
    const text = msg.text ? msg.text : '';
    const messageId = msg.message_id;
})


//-------------------------------------------------------------------------------------------------------------------------------
const PORT = process.env.PORT || 8002;

const start = async () => {
    try {
        //await sequelize.authenticate()
        //await sequelize.sync()
        
        httpsServer.listen(PORT, async() => {
            console.log('HTTPS Server BotRenthub running on port ' + PORT);

        });

    } catch (error) {
        console.log('Подключение к БД сломалось!', error.message)
    }
}

start()