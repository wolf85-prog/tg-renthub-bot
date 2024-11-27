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
const router = require('./botrenthub/routes/index')
const sharp = require('sharp');

const host = process.env.HOST

app.use(express.json());
app.use(cors());
app.use(express.static(path.resolve(__dirname, 'static')))
app.use('/', router)

//подключение к БД PostreSQL
const sequelize = require('./botrenthub/connections/db')
const { Op } = require('sequelize')
const {UserBot, Message, Conversation, Manager } = require('./botrenthub/models/models');

//socket.io
const {io} = require("socket.io-client")
const socketUrl = process.env.SOCKET_APP_URL

const sendMyMessage = require('./botrenthub/common/sendMyMessage');
const getManagerNotion = require("./botrenthub/common/getManagerNotion");
const addManager = require("./botrenthub/common/addManager");

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
            // 1 (пользователь бота)
            //добавить пользователя в бд
            const user = await UserBot.findOne({where:{chatId: chatId.toString()}})
            if (!user) {
                await UserBot.create({ firstname: firstname, lastname: lastname, chatId: chatId, username: username })
                console.log('Пользователь добавлен в БД')
            } else {
                console.log('Отмена добавления в БД. Пользователь уже существует')
            }

            // 2 (менеджер)
            //поиск менеджера в ноушене
            const notion = await getManagerNotion(parseInt(chatId))

            if (notion) {
                console.log('Менеджер уже существует в Notion!') 

                //добавление пользователя в БД MANAGERS
                const userW = await Manager.findOne({where:{chatId: chatId.toString()}})
                if (!userW) {
                    await Manager.create({ 
                        fio: notion[0].fio,
                        phone: notion[0].phone,
                        city: notion[0].city,
                        company: notion[0].companyId,
                        dojnost: notion[0].doljnost,
                        comteg: notion[0].comteg,
                        comment: notion[0].comment,
                        chatId: chatId,
                        worklist: JSON.stringify(notion[0].bisnes), 
                        from: 'Notion',
                    })
                    console.log('Пользователь добавлен в БД managers')
                } else {
                    console.log('Отмена операции! Пользователь уже существует в managers')   
                }                     
                                       
            } else {
                //поиск менеджера в бд
                const user = await UserBot.findOne({where:{chatId: chatId.toString()}})

                //добавить специалиста в ноушен
                const fio = 'Неизвестный заказчик'
                const managerId = await addManager(fio, chatId)
                console.log('Менеджер успешно добавлен в Notion!', managerId)

                //добавить аватар
                //const res = await addAvatar(workerId, urlAvatar)
                //console.log("res upload avatar: ", res)

                //добавление пользователя в БД MANAGERS
                const userW = await Manager.findOne({where:{chatId: chatId.toString()}})
                if (!userW) {
                    await Manager.create({ 
                        fio: 'Неизвестный заказчик', 
                        chatId: chatId, 
                        worklist: '',
                        from: 'Bot',
                        avatar: ''
                    })
                    console.log('Пользователь добавлен в БД managers')
                } else {
                    console.log('Отмена операции! Пользователь уже существует в managers')
                }
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

        // команда Добавить таблицу Претенденты
        if (text === '/getmanagers') {
            try {
                const response = await axios.get(`https://proj.uley.team:5000/api/managers/get`)
                console.log(JSON.stringify(response.data))
                return response.data
            } catch (err) {
                console.error(err.toJSON())
            }
        }

        if (text === '/updatemanager') {

            const notion = await getManagerNotion(parseInt(chatId))
            console.log("notion specialist: ", notion)
            const arr = notion[0].bisnes.map((item)=>(
                {
                    name : item.name,
                }
            ))

            try {
                const avatar = notion[0].profile.files.length > 0 ? notion[0].profile.files[0].file.url : ''
                //сохранить фото на сервере
                const date = new Date()
                const currentDate = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}T${date.getHours()}:${date.getMinutes()}`
                const directory = "/var/www/proj.uley.team/avatars/managers";
    
                //if (avatar) {  
    
                    //найти старое фото
                    var fileName = 'r'+chatId; 
                    fs.readdir(directory, function(err,list){
                        if(err) throw err;
                        for(var i=0; i<list.length; i++)
                        {
                            if(list[i].includes(fileName))
                            {
                                //удалить найденный файл (синхронно)
                                fs.unlinkSync(path.join(directory, list[i]), (err) => {
                                    if (err) throw err;
                                    console.log("Файл удален!")
                                });
                            }
                        }
                    });
    
                    //сохранить новое фото
                    const file = fs.createWriteStream('/var/www/proj.uley.team/avatars/managers/avatar_' + chatId + '_' + currentDate + '.jpg');
                    
                    const transformer = sharp()
                    .resize(500)
                    .on('info', ({ height }) => {
                        console.log(`Image height is ${height}`);
                    });
                    
                    const request = https.get(avatar, function(response) {
                        response.pipe(transformer).pipe(file);
    
                        // after download completed close filestream
                        file.on("finish", async() => {
                            file.close();
                            console.log("Download Completed");
    
                            const url = `${host}/avatars/managers/avatar_` + chatId + '_' + currentDate + '.jpg'
    
                            //обновить бд
                            const res = await Manager.update({ 
                                avatar: url,
                            },
                            { 
                                where: {chatId: chatId.toString()} 
                            })
    
                            if (res) {
                                console.log("Аватар обновлен! ", url) 
                            }else {
                                console.log("Ошибка обновления! ", worker.chatId) 
                            }
                        });
                    });
            } catch (err) {
                console.error(err, new Date().toLocaleDateString());
            }

            await Manager.update({ 
                fio: notion[0].fio,
                phone: notion[0].phone,
                city: notion[0].city,
                company: notion[0].companyId,
                dojnost: notion[0].doljnost,
                comteg: notion[0].comteg,
                comment: notion[0].comment,
                worklist: JSON.stringify(arr),
            }, 
            {where: {
               chatId: chatId.toString()
            }})
        }

        //обработка сообщений    
        if ((text || '')[0] !== '/' && text) {       
            if (text.startsWith("Reply")) {           
                //await bot.sendMessage(text.substring(6, text.indexOf('.')), text.slice(text.indexOf('.') + 2)) 
            
            } else {
//----------------------------------------------------------------------------------------------------------------
                //отправка сообщения  

                //сохраниь в бд ноушен
                
                

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

                socket.emit("sendMessageRent", {
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