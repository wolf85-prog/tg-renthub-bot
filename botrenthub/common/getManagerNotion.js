require("dotenv").config();
//notion api
const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseManagerId = process.env.NOTION_DATABASE_MANAGER_ID

//получить id блока заданной страницы по tg_id
module.exports = async function getManagerNotion(id) {
    try {
        const response = await notion.databases.query({
            database_id: databaseManagerId, 
            "filter": {
                "property": "ID",
                "rich_text": {
                    "contains": id.toString()
                }
            },
            "sorts": [{ 
                "timestamp": "created_time", 
                "direction": "ascending" 
            }]
        });

        const manager = response.results.map((page) => {
            return {
                id: page.id,
                fio: page.properties["ФИО"].title[0]?.plain_text,
                //tgID: page.properties.ID.rich_text[0]?.plain_text,
                phone: page.properties["Телефон"].phone_number,
                comment: page.properties["Комментарий"].rich_text[0] ?page.properties["Комментарий"].rich_text[0].plain_text : null,
                city: page.properties["Город"].multi_select[0] ? page.properties["Город"].multi_select[0].name : null,
                comteg: page.properties["КомТег"].multi_select[0] ? page.properties["КомТег"].multi_select[0].name : null,
                bisnes: page.properties["Сфера деятельности"].multi_select,
                projects: page.properties["Проекты"].number,
                doljnost: page.properties["Должность"].select ? page.properties["Должность"].select.name : null,
                companyId: page.properties["Компания"].relation[0] ? page.properties["Компания"].relation[0].id : null,
                profile: page.properties["Профиль"],
            };
        });

        return manager;
    } catch (error) {
        console.error(error.message)
    }
}