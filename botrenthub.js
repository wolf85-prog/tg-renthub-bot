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

//подключение к БД PostreSQL
const sequelize = require('./botrenthub/connections/db')
const { Op } = require('sequelize')
const {UserBot, Message, Conversation, } = require('./botrenthub/models/models');

//socket.io
const {io} = require("socket.io-client")
const socketUrl = process.env.SOCKET_APP_URL

//notion api
// const { Client } = require("@notionhq/client");
// const notion = new Client({ auth: process.env.NOTION_API_KEY });
// const token_fetch = 'Bearer ' + process.env.NOTION_API_KEY;
// const databaseId = process.env.NOTION_DATABASE_ID
// const databaseWorkersId = process.env.NOTION_DATABASE_WORKERS_ID

const chatTelegramId = process.env.CHAT_ID


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

    try {
        // команда Старт
        if (text === '/start') {
            //добавить пользователя в бд
            const user = await UserBot.findOne({where:{chatId: chatId.toString()}})
            if (!user) {
                await UserBot.create({ firstname: firstname, lastname: lastname, chatId: chatId, username: username })
                console.log('Пользователь добавлен в БД')
            } else {
                console.log('Отмена добавления в БД. Пользователь уже существует')
            }


            //создание чата специалиста
            try {
                let conversation_id

                //найти беседу
                const conversation = await Conversation.findOne({
                    where: {
                        members: {
                            [Op.contains]: [chatId]
                        }
                    },
                })   

                //если нет беседы, то создать 
                if (!conversation) {
                    const conv = await Conversation.create(
                    {
                        members: [chatId, chatTelegramId],
                    })
                    console.log("Беседа успешно создана: ", conv) 
                    console.log("conversationId: ", conv.id)
                    
                    conversation_id = conv.id
                } else {
                    console.log('Беседа уже создана в БД')  
                    console.log("conversationId: ", conversation.id)  
                    
                    conversation_id = conversation.id
                }

                //Привет!
                await bot.sendPhoto(chatId, 'https://proj.uley.team/upload/2024-04-02T06:20:12.952Z.jpg')

                const messageDB = await Message.create(
                {
                    text: 'Пользователь нажал кнопку "Старт"', 
                    senderId: chatId, 
                    receiverId: chatTelegramId,
                    type: 'text',
                    conversationId: conversation_id,
                    isBot: true,
                    messageId: '',
                    replyId: '',
                })

            } catch (error) {
                console.log(error.message)
            }



        }

        //обработка сообщений    
        if ((text || '')[0] !== '/' && text) {       
            if (text.startsWith("Reply")) {           
                //await bot.sendMessage(text.substring(6, text.indexOf('.')), text.slice(text.indexOf('.') + 2)) 
            
            } else {
//----------------------------------------------------------------------------------------------------------------
                //отправка сообщения   

                //обработка пересылаемых сообщений
                let str_text;
                let reply_id;
                if (msg.reply_to_message) {
                    const message = await Message.findOne({where:{messageId: msg.reply_to_message.message_id.toString()}}) 
                   str_text = `${message.dataValues.text}_reply_${text}`  
                   reply_id = msg.reply_to_message.message_id              
                } else {
                    str_text = text
                }

                // сохранить отправленное боту сообщение пользователя в БД
                const convId = sendMyMessage(str_text, 'text', chatId, messageId, reply_id)

                // Подключаемся к серверу socket
                let socket = io(socketUrl);

                socket.emit("addUser", chatId)

                socket.emit("sendMessageSpec", {
                    senderId: chatId,
                    receiverId: chatTelegramId,
                    text: str_text,
                    type: 'text',
                    convId: convId,
                    messageId: messageId,
                    replyId: reply_id,
                })

                // ответ бота
                //await bot.sendMessage(chatId, 'Я принял ваш запрос!')          
            }
        }

    } catch (error) {
        console.log('Произошла непредвиденная ошибка! ', error.message)
    }
})


//-------------------------------------------------------------------------------------------------------------------------------
const PORT = process.env.PORT || 8002;

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        
        httpsServer.listen(PORT, async() => {
            console.log('HTTPS Server BotRenthub running on port ' + PORT);

        });

    } catch (error) {
        console.log('Подключение к БД сломалось!', error.message)
    }
}

start()