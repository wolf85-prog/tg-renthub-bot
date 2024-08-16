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

    try {
        // команда Старт
        if (text === '/start') {
            //добавить пользователя в бд
            // const user = await UserBot.findOne({where:{chatId: chatId.toString()}})
            // if (!user) {
            //     await UserBot.create({ firstname: firstname, lastname: lastname, chatId: chatId, username: username })
            //     console.log('Пользователь добавлен в БД')
            // } else {
            //     console.log('Отмена добавления в БД. Пользователь уже существует')
            // }


            //создание чата специалиста
            try {
                let conversation_id

                //найти беседу
                // const conversation = await Conversation.findOne({
                //     where: {
                //         members: {
                //             [Op.contains]: [chatId]
                //         }
                //     },
                // })   

                //если нет беседы, то создать 
                // if (!conversation) {
                //     const conv = await Conversation.create(
                //     {
                //         members: [chatId, chatTelegramId],
                //     })
                //     console.log("Беседа успешно создана: ", conv) 
                //     console.log("conversationId: ", conv.id)
                    
                //     conversation_id = conv.id
                // } else {
                //     console.log('Беседа уже создана в БД')  
                //     console.log("conversationId: ", conversation.id)  
                    
                //     conversation_id = conversation.id
                // }

                //Привет!
                await bot.sendPhoto(chatId, 'https://proj.uley.team/upload/2024-04-02T06:20:12.952Z.jpg')

                // const messageDB = await Message.create(
                // {
                //     text: 'Пользователь нажал кнопку "Старт"', 
                //     senderId: chatId, 
                //     receiverId: chatTelegramId,
                //     type: 'text',
                //     conversationId: conversation_id,
                //     isBot: true,
                //     messageId: '',
                //     replyId: '',
                // })

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


                // ответ бота
                await bot.sendMessage(chatId, 'Я принял ваш запрос!')          
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