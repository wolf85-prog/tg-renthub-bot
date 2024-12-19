const {Sequelize} = require('sequelize')

module.exports = new Sequelize(
    process.env.DB_NAME_P,
    process.env.DB_USER_P,
    process.env.DB_PASSWORD_P,
    {
        dialect: 'postgres',
        host: process.env.DB_HOST_P,
        port: process.env.DB_PORT_P,
        // disable logging; default: console.log
        logging: false
    }
)