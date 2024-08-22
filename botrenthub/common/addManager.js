require("dotenv").config();
//notion api
const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseManagerId = process.env.NOTION_DATABASE_MANAGER_ID

module.exports = async function addManager(title, tg_id) {
    try {
        const response = await notion.pages.create({
            parent: { database_id: databaseManagerId },
            properties: {
                // City: {
                //     "type": "rich_text",
                //     rich_text: [
                //         {
                //             type: 'text',
                //             text: {
                //                 content: citylist,
                //             },
                //         }
                //     ],
                // },
                // "Город": {
                //      "multi_select": [
                //             {
                //               "name": city,  
                //             }
                            
                //     ],
                //     "type": "multi_select",
                //     // "multi_select": citylist
                // },
                // Phone: {
                //     "type": "phone_number",
                //     "phone_number": phone
                // },
                // Age: {
                //     "type": "date",
                //     date: {
                //         "start": age,
                //         "end": null,
                //     }
                // },
                // Specialization: {
                //     "type": "multi_select",
                //     "multi_select": worklist
                // },
                ID: {
                    "type": "rich_text",
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                content: tg_id,
                            },
                        }
                    ],
                },
                "ФИО": {
                    title:[
                        {
                            "text": {
                                "content": title
                            }
                        }
                    ]
                },
                // "Профиль": {
                //     "type": "files",
                //     "files": [
                //         {
                //             "name": 'image_'+ new Date().toISOString()+'.jpg',
                //             "type": "external",
                //             "external": {
                //                 "url": url_image,
                //             }
                //         }
                //     ]
                // },
            }
        })

        //console.log(response)

        const res_id = response.id;

        return res_id;

    } catch (error) {
        console.error("Ошибка добавления специалиста в Notion: ")
        console.error(error.message)
    }
}