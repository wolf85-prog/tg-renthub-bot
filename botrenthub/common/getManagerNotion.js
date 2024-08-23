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
                    "contains": id
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
                // tgId: page.properties.Telegram.number,
                // phone: page.properties.Phone.phone_number,
                // age: page.properties.Age.date,
                // city: page.properties.City.rich_text[0]?.plain_text,
                // spec: page.properties.Specialization.multi_select,
                // comment: page.properties["Комментарии"].rich_text[0]?.plain_text,
                // reyting: page.properties["Рейтинг"].rich_text[0]?.plain_text,
                // merch: page.properties.Merch.multi_select,
                // comteg: page.properties["КомТег"].multi_select,
                // rank: page.properties["Ранг"].number,
                // passport: page.properties.Passport.rich_text[0]?.plain_text,
            };
        });

        return manager;
    } catch (error) {
        console.error(error.message)
    }
}