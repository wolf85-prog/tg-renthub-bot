require("dotenv").config();
const sequelize = require('./../connections/db')
const {Project, SoundNotif} = require('./../models/models')
const sendMyMessage = require('./sendMyMessage')
// web-приложение
const webAppUrl = process.env.WEB_APP_URL;
const botApiUrl = process.env.REACT_APP_API_URL
const socketUrl = process.env.SOCKET_APP_URL
const chatTelegramId = process.env.CHAT_ID

const {specData} = require('./../data/specData');

//socket.io
const {io} = require("socket.io-client")

//fetch api
const fetch = require('node-fetch');

const fs = require('fs');
const path = require('path')

// путь к текущей директории
const _dirname = path.resolve(__dirname, 'logs') 

module.exports = async function getReports(project, bot) {

    let count_fio, count_fio2;
    let count_title;
    let i = 0;
    let j = 0;
    let databaseBlock;
    let arr_count0, arr_count, arr_count2, allDate;
    let arr_all = [];
    let all = [];
    let date_db;

    //создаю оповещения
    //получить название проекта из ноушена
    let project_name = project.name;  
    let project_status;
    
    console.log('START GET REPORTS: ' + project.id + " " + project_name)

    // начало цикла Специалисты ----------------------------------------------------------------------
    // 86400 секунд в дне
    var minutCount = 0;
        
    // повторить с интервалом 2 минуты
    //let timerId = setInterval(async() => {
    setTimeout(async() => {
        //console.log("Начало цикла отчетов. TimerId: ", timerId)
        minutCount++  // a day has passed
        arr_count0 = []
        arr_count = []
        arr_count2 = [] 
        allDate = []
        arr_all = []

        let statusProjectNew = ''; 
        let project_name = project.name;  
        let project_manager;   


        //1)получить блок и бд
        const d = new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth()+1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const chas = d.getHours();
        const minut = String(d.getMinutes()).padStart(2, "0");

        console.log(`i: ${i} ${day}.${month}.${year} ${chas}:${minut} Проект: ${project_name} Статус: ${statusProjectNew}`) 


        //2) проверить массив специалистов (1-й отчет)
            JSON.parse(project.spec).map((value)=> {           
                count_fio = 0;
                count_fio2 = 0;
                count_title = 0;

                    //для первого отчета
                    const obj = {
                        title: value.spec,
                        title2: value.cat,
                        count_fio: count_fio,
                        count_title: value.count,
                    }
                    arr_count0.push(obj) 

                //}                                           
            }) // map spec end

        //--------------------------------------------------------------------------------

        // 1-й отчет
        if (i < 1) {

                const d = new Date(project.datestart);
                const month = String(d.getMonth()+1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                const chas = d.getHours();
                const minut = String(d.getMinutes()).padStart(2, "0");

                const text = `Запрос на специалистов: 
                            
${day}.${month} | ${chas}:${minut} | ${project.name}

${arr_count0.map((item, index) =>'0' + (index+1) + '. '+ item.title + ' = ' + item.count_fio + '\/' + item.count_title).join('\n')}`    

                //отаправить 1-й отчет
                const report = await bot.sendMessage(project.chatId, text)                         
                    
                // сохранить отправленное боту сообщение пользователя в БД
                const convId = await sendMyMessage(text, 'text', project.chatId, report.message_id)

                //Подключаемся к серверу socket
                let socket = io(socketUrl);
                socket.emit("addUser", project.chatId)

                //отправить сообщение в админку
                socket.emit("sendMessage", {
                    senderId: project.chatId,
                    receiverId: chatTelegramId,
                    text: text,
                    type: 'text',
                    convId: convId,
                    messageId: report.message_id,
                })
            }
    
        i++ // счетчик интервалов
    }, 600000); //каждые 10 минут

    // остановить вывод через 30 дней
    // if (minutCount == 43200) {
    //     clearInterval(timerId);
    // }
}
