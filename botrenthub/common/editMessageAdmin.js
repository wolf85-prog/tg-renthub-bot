require("dotenv").config();

//подключение к БД PostreSQL
const {Message} = require('../models/models')
const {Conversation} = require('../models/modelsP')
const chatTelegramId = process.env.CHAT_ID
const { Op } = require('sequelize')

module.exports = async function endMessageAdmin(text, chatId, messageId) {
    //создать беседу в админке в бд 
    //сохранить отправленное боту сообщение пользователя в БД
    let  conversation_id              
    try {                  
        //найти беседу
        const conversation = await Conversation.findOne({
            where: {
                members: {
                    [Op.contains]: [chatId]
                }
            },
        })   
        
        //console.log("conversation: ", conversation)

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

        const messageDB = await Message.update(
        {
            text: text,
        },
        { 
            where: {messageId: messageId} 
        })
        console.log("messageDB: ", messageDB)

        return conversation_id;
    } catch (error) {
        console.log(error)
    }
}          