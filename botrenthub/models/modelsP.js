const sequelize = require('../connections/db_renthub')
const {DataTypes} = require('sequelize')

const UserBot = sequelize.define('userbot', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    firstname: {type: DataTypes.STRING},
    lastname: {type: DataTypes.STRING},
    chatId: {type: DataTypes.STRING, unique: true},
    username: {type: DataTypes.STRING},
    avatar: {type: DataTypes.STRING},
    block: {type: DataTypes.BOOLEAN},
})

const ProjectNew = sequelize.define('projectnew', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    crmID: {type: DataTypes.STRING},
    name: {type: DataTypes.STRING},  //название проекта
    status: {type: DataTypes.STRING},
    specifika: {type: DataTypes.STRING},
    city: {type: DataTypes.STRING},
    dateStart: {type: DataTypes.STRING},  //дата начала проекта
    dateEnd: {type: DataTypes.STRING},  //дата окончания проекта
    teh: {type: DataTypes.TEXT},
    geo: {type: DataTypes.STRING},
    managerId: {type: DataTypes.STRING},
    managerId2: {type: DataTypes.STRING},
    companyId: {type: DataTypes.STRING},
    chatId: {type: DataTypes.STRING},
    spec: {type: DataTypes.TEXT},
    comment: {type: DataTypes.TEXT},
    equipment: {type: DataTypes.TEXT},
    number: {type: DataTypes.INTEGER},
    teh1: {type: DataTypes.STRING},
    teh2: {type: DataTypes.STRING},
    teh3: {type: DataTypes.STRING},
    teh4: {type: DataTypes.STRING},
    teh5: {type: DataTypes.STRING},
    teh6: {type: DataTypes.STRING},
    teh7: {type: DataTypes.STRING},
    teh8: {type: DataTypes.STRING},
    deleted: {type: DataTypes.BOOLEAN},
})


const Report = sequelize.define('report', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}, 
    name: {type: DataTypes.STRING},  //название проекта
    text: {type: DataTypes.STRING}, //текст сообщения;
    receiverId: {type: DataTypes.STRING}, //чат-id получателя;
    date: {type: DataTypes.STRING},  //дата отправки отчета
    delivered: {type: DataTypes.BOOLEAN}, //доставлено
})


const MainSpec = sequelize.define('mainspec', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},  
    date: {type: DataTypes.STRING},
    specId: {type: DataTypes.STRING},
    vidWork: {type: DataTypes.STRING},
    specialization: {type: DataTypes.TEXT},  
    comteg: {type: DataTypes.TEXT},
    comment: {type: DataTypes.TEXT},
    stavka: {type: DataTypes.STRING},
    merch: {type: DataTypes.STRING},
    taxi: {type: DataTypes.STRING},
    projectId: {type: DataTypes.STRING},
    hr: {type: DataTypes.BOOLEAN},
    number: {type: DataTypes.INTEGER},
    count: {type: DataTypes.INTEGER},
})

const Conversation = sequelize.define('conversation', {
    members: {type: DataTypes.ARRAY(DataTypes.STRING)},
})

const Specialist = sequelize.define('specialist', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},  
    fio: {type: DataTypes.STRING},
    chatId: {type: DataTypes.STRING, unique: true},
    phone: {type: DataTypes.STRING},
    phone2: {type: DataTypes.STRING},
    specialization: {type: DataTypes.TEXT},  
    city: {type: DataTypes.STRING},
    skill: {type: DataTypes.TEXT},
    promoId: {type: DataTypes.STRING}, 
    rank: {type: DataTypes.INTEGER}, 
    merch: {type: DataTypes.STRING},
    company: {type: DataTypes.STRING},
    comteg: {type: DataTypes.TEXT},
    comteg2: {type: DataTypes.TEXT},
    comment: {type: DataTypes.TEXT}, 
    comment2: {type: DataTypes.TEXT}, 
    age: {type: DataTypes.STRING},
    reyting: {type: DataTypes.STRING},
    inn: {type: DataTypes.STRING}, 
    passport: {type: DataTypes.TEXT},
    profile: {type: DataTypes.TEXT},
    dogovor: {type: DataTypes.BOOLEAN}, 
    samozanjatost: {type: DataTypes.BOOLEAN},
    passportScan: {type: DataTypes.TEXT},
    email: {type: DataTypes.STRING},  
    blockW: {type: DataTypes.BOOLEAN},
    deleted: {type: DataTypes.BOOLEAN}, //distrib
    great: {type: DataTypes.BOOLEAN}, //hello
    block18: {type: DataTypes.BOOLEAN}, 
    krest: {type: DataTypes.BOOLEAN}, //bad
    projectAll: {type: DataTypes.INTEGER},
    projectMonth: {type: DataTypes.INTEGER},
    lateness: {type: DataTypes.INTEGER},
    noExit: {type: DataTypes.INTEGER},
    passeria: {type: DataTypes.STRING},
    pasnumber: {type: DataTypes.STRING},
    paskemvidan: {type: DataTypes.STRING},
    pasdatevidan: {type: DataTypes.STRING},
    pascode: {type: DataTypes.STRING},
    pasbornplace: {type: DataTypes.STRING},
    pasaddress: {type: DataTypes.STRING},
    surname: {type: DataTypes.STRING},
    name: {type: DataTypes.STRING},
    secondname: {type: DataTypes.STRING},
    pasdateborn: {type: DataTypes.STRING},
    projects: {type: DataTypes.TEXT},
})


module.exports = {
    UserBot,
    Report,
    ProjectNew,
    MainSpec,
    Conversation, 
    Specialist,
}