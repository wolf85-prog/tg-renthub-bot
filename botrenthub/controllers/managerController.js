require("dotenv").config();
const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseManagerId = process.env.NOTION_DATABASE_MANAGER_ID
const databaseCompanyId = process.env.NOTION_DATABASE_COMPANY_ID

const token = process.env.TELEGRAM_API_TOKEN

const { Manager } = require('../models/models')

const { Specialist } = require('../models/modelsP')

const axios = require("axios");

//socket.io
const {io} = require("socket.io-client");
const socketUrl = process.env.SOCKET_APP_URL

const $host = axios.create({
    baseURL: process.env.REACT_APP_API_URL
})
const chatTelegramId = process.env.CHAT_ID

const sendMessageAdmin = require("../common/sendMessageAdmin");
const sendMyMessage = require("../common/sendMyMessage");

//получить TelegramID менеджера по его id
async function getManagerId(id) {
    try {
        const manager = await notion.pages.retrieve({
            page_id: id,
        });

        return manager.properties.ID.rich_text[0]?.plain_text; 
        
    } catch (error) {
        console.error(error.message)
    }
}

//получить id менеджера по его TelegramID
async function getManagerChatId(id) {
    try {
        const response = await notion.databases.query({
            database_id: databaseManagerId, 
            "filter": {
                "property": "ID",
                "rich_text": {
                    "contains": id
                }
            }
        });

        console.log("-------------------------------------------------------")
        console.log("----------------Открытие приложения--------------------")
        console.log("-------------------------------------------------------")
        console.log("TelegramID: ", id)
        console.log("ManagerId: ", response.results[0]?.id)

        return response.results[0]?.id; 
        
    } catch (error) {
        console.error(error.message)
    }
}

//получить имя менеджера по его id
async function getManagerName(id) {
    try {
        const manager = await notion.pages.retrieve({
            page_id: id,
        });

        return manager;
    } catch (error) {
        console.error(error.message)
    }
}

//получить id компании заказчика
async function getCompanyId(id) {
    try {
        const response = await notion.databases.query({
            database_id: databaseManagerId, 
            "filter": {
                "property": "ID",
                "rich_text": {
                    "contains": id
                }
            }
        });
        console.log("CompanyId: ", response.results[0]?.properties["Компания"].relation[0].id)
        return response.results[0]?.properties["Компания"].relation[0].id;
    } catch (error) {
        console.error(error.message)
    }
}

async function getManagers() {
    try {
        let results = []

        let data = await notion.databases.query({
            database_id: databaseManagerId
        });

        results = [...data.results]

        while(data.has_more) {
            data = await notion.databases.query({
                database_id: databaseManagerId,
                start_cursor: data.next_cursor,
            }); 

            results = [...results, ...data.results];
        }

        const managers = results.map((manager) => {
            return {
               id: manager.id,
               fio: manager.properties["ФИО"].title[0]?.plain_text,
               tgID: manager.properties.ID.rich_text[0]?.plain_text,
               phone: manager.properties["Телефон"].phone_number,
               comment: manager.properties["Комментарий"].rich_text[0] ?manager.properties["Комментарий"].rich_text[0].plain_text : null,
               city: manager.properties["Город"].multi_select[0] ? manager.properties["Город"].multi_select[0].name : null,
               comteg: manager.properties["КомТег"].multi_select[0] ? manager.properties["КомТег"].multi_select[0].name : null,
               bisnes: manager.properties["Сфера деятельности"].multi_select,
               projects: manager.properties["Проекты"].number,
               doljnost: manager.properties["Должность"].select ? manager.properties["Должность"].select.name : null,
               companyId: manager.properties["Компания"].relation[0] ? manager.properties["Компания"].relation[0].id : null,
               profile: manager.properties["Профиль"],
            };
        });

        return managers;
    } catch (error) {
        console.error(error.message)
    }
}

async function getManagers2() {
    try {
        let results = []

        let data = await notion.databases.query({
            database_id: databaseManagerId
        });

        results = [...data.results]

        while(data.has_more) {
            data = await notion.databases.query({
                database_id: databaseManagerId,
                start_cursor: data.next_cursor,
            }); 

            results = [...results, ...data.results];
        }

        return results;
    } catch (error) {
        console.error(error.message)
    }
}

async function getCompanys() {
    try {
        let data = await notion.databases.query({
            database_id: databaseCompanyId
        });

        results = [...data.results]

        while(data.has_more) {
            data = await notion.databases.query({
                database_id: databaseCompanyId,
                start_cursor: data.next_cursor,
            }); 

            results = [...results, ...data.results];
        }

        const responseResults = results.map((page) => {
            return {
               id: page.id,
               //propertys: page.properties,
               title: page.properties["Название компании"].title[0]?.plain_text,
               managers: page.properties["Менеджеры"].relation,  
               city: page.properties["Город"].rich_text[0]?.plain_text,  
            };
        });

        //console.log("companys size: ", results.length)

        return responseResults;
    } catch (error) {
        console.error(error.message)
    }
}

async function getCompany(id) {
    try {
        const response = await notion.databases.query({
            database_id: databaseCompanyId,
            "filter": {
                "property": "Менеджеры",
                "relation": {
                    "contains": id
                },
            }
        });

        const company = response.results.map((item) => {
            return {
               id: item.id,
               company: item.properties["Название компании"].title[0].plain_text,
            };
        });

        return company;
    } catch (error) {
        console.error(error.message)
    }
}

//получить имя заказчика по его id
async function getCompanyName(id) {
    try {
        const company = await notion.pages.retrieve({
            page_id: id,
        });

        return company;
    } catch (error) {
        console.error(error.message)
    }
}


async function createManager(id, firstname, lastname) {
    try {
        const response = await notion.pages.create({
            parent: { database_id: databaseManagerId },
            properties: {
                "ФИО": {
                    type: "title",
                    title: [
                        {
                            "type": "text",
                            "text": {
                                "content": firstname +" "+ lastname,
                                "link": null
                            },
                            "plain_text": firstname +" "+ lastname,
                        }
                    ]
                },
                ID: {
                    "type": "rich_text",
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": id,
                                "link": null
                            },
                            "plain_text": id,
                        }
                    ]
                },
                "Компания": {
                    "type": "relation",
                    "relation": [
                        {
                            "id": "85d03a1f-a403-4de8-99a7-de1079e99ed8"
                        }
                    ],
                },
            }
        })
        //console.log(response)
        const res_id = response.id;

        return response;
    } catch (error) {
        console.error(error.message)
    }
}

//получить данные менеджера по его tgID
async function getManagerCash(id) {
    try {
        const manager = await Manager.findOne({
            where: { chatId: id },
        });

        console.log("-------------------------------------------------------")
        console.log("--------------------Новая заявка-----------------------")
        console.log("-------------------------------------------------------")
        console.log("TelegramID: ", id)
        console.log("Manager: ", manager.companyName, manager.fio)

        return manager;
    } catch (error) {
        console.error(error.message)
    }
}

//получить всех менеджеров из БД
async function getManagerCashAll() {
    try {
        const managers = await Manager.findAll();

        //console.log("Managers: ", managers)

        return managers;
    } catch (error) {
        console.error(error.message)
    }
}


class ManagerController {

    async managers(req, res) {
        const managers = await getManagers();
        res.json(managers);
    }
    

    async managers2(req, res) {
        const managers = await getManagers2();
        res.json(managers);
    }

    async managersId(req, res) {
        const id = req.params.id; // получаем id
        const manager = await getManagerId(id);
        if(manager){
            res.json(manager);
        }
        else{
            res.json({});
        }
    }

    async managersChatId(req, res) {
        const id = req.params.id; // получаем id
        const manager = await getManagerChatId(id);
        if(manager){
            res.json(manager);
        }
        else{
            res.json({});
        }
    }

    async managerName(req, res) {
        const id = req.params.id; // получаем id
        //console.log(id)
        const manager = await getManagerName(id);
        if(manager){
            res.json(manager);
        }
        else{
            res.json({});
        }
    }

    async companyId(req, res) {
        const id = req.params.id; // получаем id
        const manager = await getCompanyId(id);
        if(manager){
            res.json(manager);
        }
        else{
            res.json({});
        }
    }

    async companys(req, res) {
        const companys = await getCompanys();
        res.json(companys);
    }

    async company(req, res) {
        const id = req.params.id; // получаем id
        //console.log(id)
        const company = await getCompany(id);
        if(company){
            res.json(company);
        }
        else{
            res.json({});
        }
    }

    async companyName(req, res) {
        const id = req.params.id; // получаем id
        //console.log(id)
        const company = await getCompanyName(id);
        if(company){
            res.json(company);
        }
        else{
            res.json({});
        }
    }


    async create(req, res) {
        const {id, firstname, lastname} = req.body;
        try {
            const managers = await createManager(id, firstname, lastname);
            res.status(200).json(managers);
        } catch (error) {
            console.error(error.message)
            res.status(500).json(error);
        }
    }

// cash managers
    async managerCash(req, res) {
        const id = req.params.id; // получаем id
        //console.log(id)
        const manager = await getManagerCash(id);
        if(manager){
            res.json(manager);
        }
        else{
            res.json({});
        }
    }

    // cash managers
    async managerCashAll(req, res) {
        //const id = req.params.id; // получаем id
        //console.log(id)
        const managers = await getManagerCashAll();
        if(managers){
            res.json(managers);
        }
        else{
            res.json({});
        }
    }


    async sendAvatar(req, res) {
        const {id} = req.params 
        const {avatar} = req.body

        const chatId = ''; //worker.dataValues.chatId

        try {          

            //отправить сообщение в админ-панель
            const text = `⚠  Внимание! Логотип компании на обработку принят! ⚠
${avatar}`
            let sendTextToTelegram
            if (text !== '') {
                const url_send_msg = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${id}&parse_mode=html&text=${text.replace(/\n/g, '%0A')}`
                console.log("Отправка текста...", url_send_msg)
                
                sendTextToTelegram = await $host.get(url_send_msg)
                //console.log("sendTextToTelegram: ", sendTextToTelegram)
                                    
                const convId = await sendMyMessage(text, "text", id, sendTextToTelegram.data.result.message_id, null, false)
                
                // Подключаемся к серверу socket
                let socket = io(socketUrl);
                socket.emit("sendMessageRent", {
                    senderId: id,
                    receiverId: chatTelegramId,
                    text: text,
                    type: 'text',
                    convId: convId,
                    messageId: sendTextToTelegram.data.result.message_id,
                }) 
                
            }
                                                                
            return res.status(200).json({});
        } catch (error) {
            return res.status(500).json(error.message);
        }
    }

    //получить данные менеджера по его tgID
    async getWorkerReyting(req, res) {
        const {reyting, projectname, projectdata, workerId, comment, comteg} = req.body; 

        try {    
            let spec = await Specialist.findOne( {where: {id: workerId}} )
            console.log("spec: ", spec)

            //комтег 2
            let comtegArr2 = []           
            const obj1 = {
                name: comteg,
            }
            comtegArr2 = JSON.parse(spec.comteg2)
            comtegArr2.push(obj1)


            //комментарии 2
            let commentArr2 = [] 
            const obj2 = {
                //content: '❌' + '| Рейтинг: ' + reyting + ' | Проект ID: ' + projectname + '\n' + comment,
                content: '❌ ' + projectdata?.split('T')[0] + ' | ' + projectname + ' - ' + comment + '\n',
            }
            commentArr2 = JSON.parse(spec.comment2)
            commentArr2.unshift(obj2)

            const strProjects = projectdata?.split('T')[0] + ' | ' + projectname + ' | ' + reyting + '\n' + spec?.projects ? spec.projects : ''


            console.log("-------------------------------------------------------")
            console.log("--------------------Новый рейтинг-----------------------")
            console.log("-------------------------------------------------------")
            console.log("ProjectName: ", projectname, projectdata)
            console.log("WorkerId: ", workerId)
            console.log("Reyting: ", strProjects)
            console.log("Comteg: ", comteg)
            console.log("Comment: ", comment)

            const editUser = await Specialist.update(
                { 
                    comteg2: JSON.stringify(comtegArr2),
                    comment2: JSON.stringify(commentArr2),
                    projects: strProjects,
                },
                { where: {id: workerId} })
            return res.status(200).json(editUser);
        } catch (error) {
            return res.status(500).json(error.message);
        }

    }

    
}


module.exports = new ManagerController()