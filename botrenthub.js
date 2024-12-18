require("dotenv").config();

//telegram api
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_API_TOKEN_PROJECT

const bot = new TelegramBot(token, {polling: true })

//fetch api
const fetch = require('node-fetch');

// web-приложение
const webAppUrl = process.env.WEB_APP_URL;
const botApiUrl = process.env.REACT_APP_API_URL

const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const app = express();
const path = require('path')
const router = require('./botrenthub/routes/index')
const sharp = require('sharp');
const axios = require('axios');

const $host = axios.create({
    baseURL: process.env.REACT_APP_API_URL
})

const host = process.env.HOST

let projectId, projectName, projectDate, projectTime, dateStart, manager_id, company_id, Geo, Teh, Worklist, Equipmentlist;

app.use(express.json());
app.use(cors());
app.use(express.static('tg-renthub-bot'));
app.use(express.static(path.resolve(__dirname, 'static')))
app.use('/', router)

//подключение к БД PostreSQL
const sequelize = require('./botrenthub/connections/db')
const sequelizeR = require('./botrenthub/connections/db_renthub')
const { Op } = require('sequelize')
const {UserBot, Message, Manager, Company } = require('./botrenthub/models/models');
const { ProjectNew, Conversation } = require('./botrenthub/models/modelsR');
//socket.io
const {io} = require("socket.io-client")
const socketUrl = process.env.SOCKET_APP_URL

const sendMyMessage = require('./botrenthub/common/sendMyMessage');
const addMainSpec = require("./botrenthub/common/addMainSpec");
const sendMessageAdmin = require('./botrenthub/common/sendMessageAdmin')
const getReports = require('./botrenthub/common/getReports')

const chatTelegramId = process.env.CHAT_ID
const chatGroupId = process.env.CHAT_GROUP_ID

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


//--------------------------------------------------------------------------------------------------------
//              REQUEST
//--------------------------------------------------------------------------------------------------------

//создание страницы (проекта) базы данных проектов
app.post('/web-data', async (req, res) => {
    const {queryId, projectname, datestart, geo, teh, managerId, companyId, worklist = [], equipmentlist = [], chatId} = req.body;
    const d = new Date(datestart);
    const year = d.getFullYear();
    const month = String(d.getMonth()+1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const chas = d.getHours();
    const minut = String(d.getMinutes()).padStart(2, "0");
    try {
        if (worklist.length > 0) {

            console.log("Начинаю сохранять данные по заявке...", managerId, companyId,)
            projectName = projectname
            projectDate = `${day}.${month}`
            projectTime = `${chas}:${minut}`
            dateStart = datestart
            Teh = teh
            Worklist = worklist
            Equipmentlist = equipmentlist 
            manager_id = managerId
            company_id = companyId
            Geo = geo   
            console.log("Сохранение данных завершено: ", projectName)
            
            await bot.answerWebAppQuery(queryId, {
                type: 'article',
                id: queryId,
                title: 'Проект успешно создан',
                input_message_content: {
                    parse_mode: 'HTML',
                    message_text: 
  `Проект успешно создан! ${ companyId === 'Локальный заказчик' ? 'Offline' : ''} 
  
<b>Проект:</b> ${projectname} 
<b>Дата:</b> ${day}.${month}.${year}
<b>Время:</b> ${chas}:${minut} 
<b>Адрес:</b> ${geo} 
<b>Тех. задание:</b> ${teh}
  
<b>Специалисты:</b>  
${worklist.map(item =>' - ' + item.spec + ' = ' + item.count + ' чел.').join('\n')}`
              }
        })
        
        //отправить сообщение в чат-админку (телеграм)
        await bot.sendMessage(chatGroupId, 
`Проект успешно создан! ${ companyId === 'Локальный заказчик' ? 'Offline' : ''} 
  
Название проекта:  ${projectname} 
Дата: ${day}.${month}.${year}
Время: ${chas}:${minut} 
Адрес: ${geo} 
Тех. задание: ${teh} 
  
Специалисты:  
${worklist.map(item => ' - ' + item.spec + ' = ' + item.count + ' чел.').join('\n')}`
          )

        } 
  
        return res.status(200).json({});
    } catch (e) {
        return res.status(500).json({})
    }
})

//-----------------------------------------------------------------------------------------
// START (обработка команд и входящих сообщени от пользователя)
//-----------------------------------------------------------------------------------------

bot.on('message', async (msg) => {
    console.log("msg: ", msg)
    const chatId = msg.chat.id;
    const firstname = msg.from.first_name
    const lastname = msg.from.last_name
    const username = msg.from.username ? msg.from.username : ''
    const text = msg.text ? msg.text : '';
    const messageId = msg.message_id;

    try {
        // команда Старт
        if (text === '/start') {
            // 1 (пользователь бота)
            //добавить пользователя в бд
            const user = await UserBot.findOne({where:{chatId: chatId.toString()}})
            if (!user) {
                await UserBot.create({ firstname: firstname, lastname: lastname, chatId: chatId, username: username, block: false })
                console.log('Пользователь добавлен в БД')
            } else {
                console.log('Отмена добавления в БД. Пользователь уже существует')
                
                console.log('Обновление ника...', username)
                const res = await UserBot.update({ 
                    username: username,
                },
                { 
                    where: {chatId: chatId.toString()} 
                })
            }

            // 2 (менеджер)
            //поиск менеджера в бд
            const userW = await Manager.findOne({where:{chatId: chatId.toString()}})
                        
            if (!userW) {
                //добавление пользователя в БД MANAGERS
                await Manager.create({ 
                    fio: lastname + ' ' + firstname,
                    chatId: chatId,
                })
                console.log('Пользователь добавлен в БД managers')                   
                                       
            } else {
                console.log('Отмена операции! Пользователь уже существует в managers')
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

                // await bot.sendPhoto(chatId, 'https://proj.uley.team/upload/2024-05-18T09:08:53.561Z.jpg', {
                //     reply_markup: ({
                //         inline_keyboard:[
                //             [{text: 'Поехали!', web_app: {url: webAppUrl}}],
                //         ]
                //     })
                // })

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
                console.log("Ошибка создания чата: ", error.message)
            }
        }

        // команда Добавить таблицу Претенденты
        if (text === '/getmanagers') {
            try {
                const response = await axios.get(``)
                console.log(JSON.stringify(response.data))

                response.data.map(async (user, index) => {      
                    setTimeout(async()=> { 
                        console.log(index + " Менеджер: " + user.fio + " сохранен!")
    
                        //сохранение сообщения в базе данных wmessage
                        await Manager.create(user)
    
                    }, 500 * ++index) 
                })

                //return response.data
            } catch (err) {
                console.error(err.toJSON())
            }
        }

        if (text === '/getcompanies') {
            try {
                const response = await axios.get(``)
                console.log(JSON.stringify(response.data))

                response.data.map(async (user, index) => {      
                    setTimeout(async()=> { 
                        console.log(index + " Компания: " + user.title + " сохранена!")
    
                        //сохранение сообщения в базе данных wmessage
                        await Company.create(user)
    
                    }, 500 * ++index) 
                })

                //return response.data
            } catch (err) {
                console.error(err.toJSON())
            }
        }

        if (text === '/getuserbots') {
            try {
                const response = await axios.get(``)
                console.log(JSON.stringify(response.data))

                response.data.map(async (user, index) => {      
                    setTimeout(async()=> { 
                        console.log(index + " User: " + user.firstname + " сохранен!")
    
                        //сохранение сообщения в базе данных wmessage
                        await UserBot.create(user)
    
                    }, 500 * ++index) 
                })

                //return response.data
            } catch (err) {
                console.error(err.toJSON())
            }
        }
        
        if (text === '/sendsmeta') {
            try {
                        //const poster = 'https://proj.uley.team/files/1389/pre/1389_1408579113_customer.pdf'
                        const poster = `${host}/files/3417/pre/3417_434263815_customer_3.pdf`
                        console.log("poster API: ", poster)         
            
                        console.log("Отправляю постер...")
                        //const url_send_poster = `https://api.telegram.org/bot${token}/sendDocument?chat_id=${chatId}&document=${poster}&reply_markup=${keyboard}`
                        const url_send_poster = `https://api.telegram.org/bot${token}/sendDocument?chat_id=${chatId}&document=${poster}`
                        console.log(url_send_poster)
            
                        // создание базы данных "Основной состав"
                        const response2 = await $host.get(url_send_poster);
            
            
                        //сохранение сметы в базе данных
                        const convId = await sendMessageAdmin(poster, "image", chatId, response2.data?.result?.message_id, null, false, 'Подтверждаю')
                        //console.log("convId: ", convId)
            
                        // Подключаемся к серверу socket
                        let socket = io(socketUrl);
                        //socket.emit("addUser", chatId)
            
                        // //сохранить в контексте (отправка) сметы в админку
                        socket.emit("sendAdminRent", { 
                            senderId: chatTelegramId,
                            receiverId: chatId,
                            text: poster,
                            type: 'image',
                            buttons: 'Подтверждаю',
                            convId: convId,
                            messageId: response2.data?.result?.message_id,
                        })
            
                        //return res.status(200).json("Poster has been sent successfully");
                    } catch (error) {
                        return console.log(error.message);
                    }
        }

        //------------------------------------------------------------------------------------------------
        //обработка контактов
        if (msg.contact) {
            await bot.sendMessage(chatId, `Ваш контакт получен!`)
            const phone = msg.contact.phone_number
            const firstname = msg.contact.first_name
            const lastname = msg.contact.last_name ? msg.contact.last_name : ''
            
            //const response = await bot.sendContact(chatTelegramId, phone, firstname, lastname, vcard)  
            //const response2 = await bot.sendContact(chatGiaId, phone, firstname, lastname, vcard)   
            const text_contact = `${phone} ${firstname} ${lastname}`

            console.log("Отправляю контакт в админ-панель...")

            //отправить сообщение о контакте в админ-панель
            const convId = await sendMyMessage(text_contact, "text", chatId, messageId, null, false)
                
                // Подключаемся к серверу socket
                let socket = io(socketUrl);
                socket.emit("addUser", chatId)
                
                //отправить сообщение в админку
                socket.emit("sendMessageRent", {
                    senderId: chatId,
                    receiverId: chatTelegramId,
                    text: text_contact,
                    type: 'text',
                    convId: convId,
                    messageId: messageId,
                    isBot: false,
                })
        }
        //--------------------------------------------------------------------------------------------------
        //обработка документов
        if (msg.document) {
            console.log(msg.document)
            const docum = await bot.getFile(msg.document.file_id);
            try {
                const res = await fetch(
                    `https://api.telegram.org/bot${token}/getFile?file_id=${docum.file_id}`
                );

                // extract the file path
                const res2 = await res.json();
                const filePath = res2.result.file_path;

                // now that we've "file path" we can generate the download link
                const downloadURL = `https://api.telegram.org/file/bot${token}/${filePath}`;

                https.get(downloadURL,(res) => {
                    const filename = Date.now()
                    // Image will be stored at this path
                    let path;
                    let ras;
                    if(msg.document) {
                        ras = msg.document.mime_type.split('/')
                        //path = `${__dirname}/static/${filename}.${ras[1]}`; 
                        path = `${__dirname}/static/${msg.document.file_name}`.replaceAll(/\s/g, '_'); 
                    }
                    const filePath = fs.createWriteStream(path);
                    res.pipe(filePath);
                    filePath.on('finish', async () => {
                        filePath.close();
                        console.log('Download Completed: ', path); 
                        
                        let convId;
                        if(msg.document) {
                            // сохранить отправленное боту сообщение пользователя в БД
                            convId = await sendMyMessage(`${botApiUrl}/${msg.document.file_name}`.replaceAll(/\s/g, '_'), 'file', chatId, messageId)
                        }

                        // Подключаемся к серверу socket
                        let socket = io(socketUrl);
                        socket.emit("addUser", chatId)
                        socket.emit("sendMessageRent", {
                            senderId: chatId,
                            receiverId: chatTelegramId,
                            text: `${botApiUrl}/${msg.document.file_name}`.replaceAll(/\s/g, '_'),
                            convId: convId,
                            isBot: false,
                        })
                    })
                })
            } catch (error) {
                console.log(error.message)
            }
        }
        //----------------------------------------------------------------------------------------------------------------          
        //обработка изображений
        if (msg.photo) {
            console.log(msg.photo)
            //console.log(msg.photo.length)
            const image = await bot.getFile(msg.photo[msg.photo.length-1].file_id);

            try {
                const res = await fetch(
                    `https://api.telegram.org/bot${token}/getFile?file_id=${image.file_id}`
                );

                // extract the file path
                const res2 = await res.json();
                const filePath = res2.result.file_path;

                // now that we've "file path" we can generate the download link
                const downloadURL = `https://api.telegram.org/file/bot${token}/${filePath}`;

                https.get(downloadURL,(res) => {
                    const filename = Date.now()
                    // Image will be stored at this path
                    const path = `${__dirname}/static/${filename}.jpg`; 
                    const filePath = fs.createWriteStream(path);
                    res.pipe(filePath);
                    filePath.on('finish', async () => {
                        filePath.close();
                        console.log('Download Completed: ', path); 
                        
                        // сохранить отправленное боту сообщение пользователя в БД
                        const convId = await sendMyMessage(`${botApiUrl}/${filename}.jpg`, 'image', chatId, messageId)

                        // Подключаемся к серверу socket
                        let socket = io(socketUrl);

                        socket.emit("addUser", chatId)
                        //socket.on("getUsers", users => {
                            //console.log("users from bot: ", users);
                        //})

                        socket.emit("sendMessageRent", {
                            senderId: chatId,
                            receiverId: chatTelegramId,
                            text: `${botApiUrl}/${filename}.jpg`,
                            type: 'image',
                            convId: convId,
                        })
                    })
                })            
            } catch (error) {
                console.log(error.message)
            }
        }
        //---------------------------------------------------------------------------------------------------------------

        //обработка аудио сообщений
        if (msg.voice) {
            await bot.sendMessage(chatId, `Ваше аудио-сообщение получено!`)
            const voice = await bot.getFile(msg.voice.file_id);

            try {
                const res = await fetch(
                    `https://api.telegram.org/bot${token}/getFile?file_id=${voice.file_id}`
                );

                // extract the file path
                const res2 = await res.json();
                const filePath = res2.result.file_path;

                // now that we've "file path" we can generate the download link
                const downloadURL = `https://api.telegram.org/file/bot${token}/${filePath}`;

                https.get(downloadURL,(res) => {
                    const filename = Date.now()
                    // Image will be stored at this path
                    let path;
                    let ras;
                    if(msg.voice) {
                        ras = msg.voice.mime_type.split('/')
                        //path = `${__dirname}/static/${filename}.${ras[1]}`; 
                        path = `${__dirname}/static/${msg.voice.file_unique_id}.${ras[1]}`; 
                    }
                    const filePath = fs.createWriteStream(path);
                    res.pipe(filePath);
                    filePath.on('finish', async () => {
                        filePath.close();
                        console.log('Download Completed: ', path); 
                        
                        let convId;
                        if(msg.voice) {
                            // сохранить отправленное боту сообщение пользователя в БД
                            convId = await sendMyMessage(`${botApiUrl}/${msg.voice.file_unique_id}.${ras[1]}`, 'file', chatId, messageId)
                        }

                        //Подключаемся к серверу socket
                        let socket = io(socketUrl);
                        socket.emit("addUser", chatId)
                        socket.emit("sendMessageRent", {
                            senderId: chatId,
                            receiverId: chatTelegramId,
                            text: `${botApiUrl}/${msg.voice.file_unique_id}.${ras[1]}`,
                            convId: convId,
                            isBot: false,
                        })
                    })
                })            
            } catch (error) {
                console.log(error.message)
            }
        }

//---------------------------------------------------------------------------------------------------------------- 

        //обработка сообщений    
        if ((text || '')[0] !== '/' && text) {       
            if (text.startsWith("Reply")) {           
                //await bot.sendMessage(text.substring(6, text.indexOf('.')), text.slice(text.indexOf('.') + 2)) 

            // Проект успешно создан
        } else if (text.startsWith('Проект успешно создан')) {           
            //const response = await bot.sendMessage(chatTelegramId, `${text} \n \n от ${firstname} ${lastname} ${chatId}`)

            console.log("Отправляю сообщение в админ-панель...")

            //отправить сообщение о создании проекта в админ-панель
            const convId = await sendMyMessage(text, "text", chatId, "")
            
            // Подключаемся к серверу socket
            let socket = io(socketUrl);
            socket.emit("addUser", chatId)
            
            //отправить сообщение в админку
            socket.emit("sendMessageRent", {
                senderId: chatId,
                receiverId: chatTelegramId,
                text: text,
                type: 'text',
                convId: convId,
                //messageId: response.message_id,
            })


            //массив специалистов
            let specArr = []
            console.log("Сохраняю Worklist в БД: ", Worklist)
            if (Worklist !== '') {
                specArr = Worklist.map(item => ({
                    spec: item.spec,
                    cat: item.cat,
                    count: item.count,
                }));
            }

            //массив оборудования
            let equipArr = []
            console.log("Сохраняю Equipmentlist в БД: ", Equipmentlist)
            if (Equipmentlist !== '') {
                equipArr = Equipmentlist.map(item => ({
                    name: item.spec,
                    subname: item.subname,
                    cat: item.cat,
                    count: item.count,
                }));
            } 
            
//-------------------------------------------------------------------------------------------------------------------------------
//--------------------------- Создание проекта ----------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------
            try {
                const crm = await sequelizeR.query("SELECT nextval('crm_id')");

                const resid = crm[0][0].nextval

                // const res = await Project.create({ 
                //     name: projectName, 
                //     datestart: dateStart, 
                //     spec: JSON.stringify(specArr),
                //     equipment: JSON.stringify(equipArr),
                //     teh: Teh, 
                //     geo: Geo, 
                //     managerId: manager_id, 
                //     companyId: company_id, 
                //     chatId: chatId
                // })

                const obj = {                
                    crmID: resid.toString(),
                    name: projectName,
                    status: 'Новый',
                    //specifika: '',
                    //city: '',
                    dateStart: dateStart + ':00.000Z',  
                    //dateEnd: project?.dateend, 
                    teh: Teh,
                    geo: Geo,
                    managerId: manager_id,
                    companyId: company_id,
                    chatId: chatId,
                    spec: JSON.stringify(specArr),  
                    comment: '',
                    equipment: JSON.stringify(equipArr),
                }
                console.log("obj :", obj)

                const resAdd2 = await ProjectNew.create(obj)
                console.log("resAdd2: ", resAdd2)

                if (resAdd2) {
                    const startD = resAdd2.dateStart?.split('T')[0].split('-')[2] + '.' + resAdd2.dateStart?.split('-')[1] + '.' + resAdd2.dateStart?.split('-')[0]
                    const startT = resAdd2.dateStart?.split('T')[1]?.slice(0, 5)
                    //добавление специалистов в основной состав
                    const dateStart = startD + 'T' + startT


                    //добавить список работников        
                    Worklist.forEach((worker, index) => {           
                        for (let i = 0; i < worker.count; i++) {
                            setTimeout(async()=> {
                                const res = await addMainSpec(resAdd2?.id, dateStart, worker.spec, '№1');
                                console.log("res add spec main: ", res, index+1) 
                            }, 300 * i) 
                        }    
                    });                   
                }

                //очистить переменные
                console.log("Очищаю переменные...")
                projectName = '';
                projectDate = '';
                projectTime = '';
                dateStart = '';
                Teh = '';
                //Worklist = [];
                //Equipmentlist = [];
                manager_id = '';
                company_id = '';
                Geo = '';

                console.log('Проект успешно добавлен в БД! Project: ' + resAdd2)  

                // отправить сообщение пользователю через 30 секунд
                setTimeout(() => {bot.sendMessage(chatId, 'Ваша заявка принята!')}, 25000) // 30 секунд                   
                
                const project2 = await ProjectNew.findOne({where:{id: resAdd2.id}})  
                
                //начать получать отчеты
                getReports(project2, bot)
                
                                
            } catch (error) {
                console.log("Ошибка сохранения проекта: ", error.message)
            }
            
        } else {
//----------------------------------------------------------------------------------------------------------------
                //отправка сообщения 
                // Подключаемся к серверу socket
                let socket = io(socketUrl);
                socket.emit("addUser", chatId)   
                
                //добавить пользователя в бд
                const user = await UserBot.findOne({where:{chatId: chatId.toString()}})
                if (!user) {
                    console.log('Начинаю сохранять данные пользователя...')
                    await UserBot.create({ chatId: chatId })
                    console.log('Пользователь добавлен в БД')
                } else {
                    console.log('Отмена добавления в БД. Пользователь уже существует')
                    
                    console.log('Обновление ника...')
                    const res = await UserBot.update({ 
                        username: username,
                    },
                    { 
                        where: {chatId: chatId.toString()} 
                    })
                }

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

//--------------------------------------------------------------------------------------------------------------------
  
  //Ответ на нажатие кнопок настройки и информаци
  bot.on('callback_query', async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;
    const messageId = msg.message.message_id;
  
    if (data === '/menu') {
        return bot.sendMessage(chatId, 'Смотрите и создавайте Notion-проекты в web-приложении прямо из мессенджера Telegram.', {
            reply_markup: ({
                inline_keyboard:[
                    [{text: 'Информация', callback_data:'Информация'}, {text: 'Настройки', callback_data:'Настройки'}],
                    [{text: 'Открыть Notion-проекты', web_app: {url: webAppUrl}}],
                ]
            })
        })
    }

    //предварительная смета
    if (data.startsWith('/smeta')) {
        const projectId = data.split(' ');
        console.log("projectId: ", projectId[1])
        console.log("Начинаю обрабатывать запрос подтверждения сметы...")

        //const crmId = await getProject(projectId[1])

        // const block1 = await getBlock(projectId[1])
        // console.log("block1: ", block1.results[0].id)
                        
        // const block2 = await getBlock(block1.results[0].id)
        // console.log("block2: ", block2.results[0].id)
                        
        // const block3 = await getBlock(block2.results[0].id)
        // console.log("block3: ", block3.results[0].id)  
        
            
        // if (block3) {
        //     //поставить галочку в проекте в поле Предварительная смета
        //     await updateToDo(block3.results[0].id); 
        // } else {
        //     console.log("Ошибка установки чека")
        // }

        //const poster = `${host}/files/${crmId}/pre/${crmId}_${chatId}_customer_1.pdf`
        //console.log("poster: ", poster)
        

        // Подключаемся к серверу socket
        let socket = io(socketUrl);
        socket.emit("addUser", chatId)

        //отправить сообщение об одобрении сметы проекта в админ-панель
        const convId = await sendMyMessage('Предварительная смета одобрена!', "text", chatId, messageId)

        socket.emit("sendMessageRent", {
            senderId: chatId,
            receiverId: chatTelegramId,
            text: 'Предварительная смета одобрена!',
            convId: convId,
            messageId: messageId,
            replyId: ''
        })

        return bot.sendMessage(chatId, 'Предварительная смета одобрена!')
    }

    //финальная смета
    if (data.startsWith('/finalsmeta')) {
        const projectId = data.split(' ');
        console.log("projectId: ", projectId[1])
        console.log("Начинаю обрабатывать запрос подтверждения финальной сметы...")

        // Подключаемся к серверу socket
        let socket = io(socketUrl);
        socket.emit("addUser", chatId)

        //отправить сообщение об одобрении сметы проекта в админ-панель
        const convId = await sendMyMessage('Финальная смета одобрена!', "text", chatId, messageId)

        socket.emit("sendMessageRent", {
            senderId: chatId,
            receiverId: chatTelegramId,
            text: 'Финальная смета одобрена!',
            convId: convId,
            messageId: messageId,
            replyId: ''
        })
        
        // const block1 = await getBlock(projectId[1])
        // console.log("block1: ", block1.results[0].id) //первый объект (to do)

        // //pre final                     
        // const block2_1 = await getBlock(block1.results[0].id)
        // console.log("block2_1: ", block2_1.results[0].id) // 1-й объект (предварительная смета и финальная смета)
                        
        // const block3_1 = await getBlock(block2_1.results[0].id)
        // console.log("block3_1: ", block3_1.results[0].id) // 1-й объект (предварительная смета)

        // const block3_2 = await getBlock(block2_1.results[0].id)
        // console.log("block3_2: ", block3_2.results[1].id) // 2-й объект (финальная смета)


        // if (block3_2) {
        //     //поставить галочку в проекте в поле Финальная смета
        //     await updateToDoFinal(block3_2.results[1].id); //22.03.2024
        // } else {
        //     console.log("Ошибка установки чека")
        // }  

        //найти смету по свойству Проект
        //const smetaId = await getSmeta(projectId[1])
        

        return bot.sendMessage(chatId, 'Финальная смета одобрена!')
    }

    //кнопка в отчете
    if (data === '/report_accept') {

        //отправить сообщение о создании проекта в админ-панель
        const convId = await sendMyMessage('Информация подтверждена', "text", chatId, messageId)

        // Подключаемся к серверу socket
        let socket = io(socketUrl);
        socket.emit("addUser", chatId)
        socket.emit("sendMessage", {
            senderId: chatId,
            receiverId: chatTelegramId,
            text: 'Информация подтверждена',
            convId: convId,
            messageId: messageId,
        })


        return bot.sendMessage(chatId, 'Информация подтверждена')
    }

    if (data === '/report') {

        //отправить сообщение о создании проекта в админ-панель
        const convId = await sendMyMessage('Пользователь нажал кнопку в рассылке', "text", chatId)

        // Подключаемся к серверу socket
        let socket = io(socketUrl);
        socket.emit("addUser", chatId)
        socket.emit("sendMessage", {
            senderId: chatId,
            receiverId: chatTelegramId,
            text: 'Пользователь нажал кнопку в рассылке',
            convId: convId,
            messageId: messageId,
        })


        return bot.sendMessage(chatId, 'Ваша заявка принята! Мы свяжемся с вами в ближайшее время.')
    }

    bot.sendMessage(chatId, `Вы нажали кнопку ${data}`, backOptions)
  });


//-------------------------------------------------------------------------------------------------------------------------------
const PORT = process.env.PORT || 8002;

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()

        await sequelizeR.authenticate()
        await sequelizeR.sync()
        
        httpsServer.listen(PORT, async() => {
            console.log('HTTPS Server BotRenthub running on port ' + PORT);

            // 1. получить новые проекты
            let arr = []
            const d = new Date().getTime() + 10800000

            // 2. Отчеты проектов
            setTimeout(()=>{
                //запуск отчетов
                console.log('Запускаю отчеты проектов...');
                
                // arr.map(async (project, i) => {
                //     console.log(project?.name + " - " + project?.date)
                    
                //     setTimeout(function(){
                //         //начать получать отчеты
                //         getReportsTest(project.id, project.name, bot, currentProcess, dataProcess, dataInterval, dataTime)
                //     }, 2000 * ++i)     
                // })
            }, 6000) 

        });

    } catch (error) {
        console.log('Подключение к БД сломалось!', error.message)
    }
}

start()