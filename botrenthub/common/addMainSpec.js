require("dotenv").config();
//подключение к БД PostreSQL
const sequelize = require('../connections/db_renthub')
const { MainSpec } = require('../models/modelsP')
const chatTelegramId = process.env.CHAT_ID
const { Op } = require('sequelize')

module.exports = async function addMainSpec(projectId, date, specialization, stavka) {
    try {    

        const newUser = await MainSpec.create({
            projectId, 
            date,
            specialization,
            stavka,
        })

        return newUser;
    } catch (error) {
        console.log(error)
    }
}          