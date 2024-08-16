const sequelize = require('../connections/db')
const {DataTypes} = require('sequelize')

const UserBot = sequelize.define('ruserbot', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    firstname: {type: DataTypes.STRING},
    lastname: {type: DataTypes.STRING},
    chatId: {type: DataTypes.STRING, unique: true},
    avatar: {type: DataTypes.STRING},
    username: {type: DataTypes.STRING},
    block: {type: DataTypes.BOOLEAN},
})

// const Manager = sequelize.define('rmanager', {
//     id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
//     userfamily: {type: DataTypes.STRING},
//     username: {type: DataTypes.STRING},
//     phone: {type: DataTypes.STRING},
//     dateborn: {type: DataTypes.STRING},  
//     city: {type: DataTypes.STRING},
//     companys: {type: DataTypes.STRING},
//     stag: {type: DataTypes.STRING},
//     worklist: {type: DataTypes.STRING},
//     chatId: {type: DataTypes.STRING, unique: true},
//     promoId: {type: DataTypes.STRING},
//     from: {type: DataTypes.STRING},
//     avatar: {type: DataTypes.STRING},
//     comment: {type: DataTypes.TEXT}, 
//     rank: {type: DataTypes.INTEGER}, 
//     block: {type: DataTypes.BOOLEAN},
//     deleted: {type: DataTypes.BOOLEAN},
//     newcity: {type: DataTypes.STRING},
//     great: {type: DataTypes.BOOLEAN},
// })

const Message = sequelize.define('rmessage', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    conversationId: {type: DataTypes.STRING},
    senderId: {type: DataTypes.STRING},
    receiverId: {type: DataTypes.STRING},    
    text: {type: DataTypes.STRING}, //текст сообщения;
    type: {type: DataTypes.STRING},      //тип сообщения;
    isBot: {type: DataTypes.BOOLEAN},
    messageId: {type: DataTypes.STRING},
    buttons: {type: DataTypes.STRING},   //названия кнопок;
    replyId: {type: DataTypes.STRING}, //id пересылаемого сообщения
})

const Conversation = sequelize.define('rconversation', {
    members: {type: DataTypes.ARRAY(DataTypes.STRING)},
})

const Distribution = sequelize.define('rdistribution', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}, 
    text: {type: DataTypes.STRING}, //текст сообщения;
    image: {type: DataTypes.STRING}, //ссылка на картинку;
    project: {type: DataTypes.STRING}, //проект (название);
    receivers: {type: DataTypes.STRING}, //массив получателей;
    datestart: {type: DataTypes.STRING},  //дата начала рассылки
    delivered: {type: DataTypes.BOOLEAN}, //доставлено
    projectId: {type: DataTypes.STRING}, //проект (id);
    count: {type: DataTypes.INTEGER}, 
    date: {type: DataTypes.STRING},  //дата начала рассылки  
    users: {type: DataTypes.TEXT},
    button: {type: DataTypes.STRING}, //текст кнопки;
    uuid: {type: DataTypes.STRING}, //индекс рассылки;
    success: {type: DataTypes.INTEGER}, 
    report: {type: DataTypes.TEXT},
    editButton: {type: DataTypes.BOOLEAN}, //редактируемая кнопка
})


module.exports = {
    UserBot, 
    //Worker,
    Message, 
    Conversation, 
    Distribution,
}

