const Router = require('express')
const router = new Router()

//const projectController = require('../controllers/projectController')
const managerController = require('./../controllers/managerController')
//const databaseController = require('../controllers/databaseController')
//const blockController = require('../controllers/blockController')
const posterController = require('../controllers/posterController')


// get PROJECTS  
// router.get("/projects", projectController.projects);
// router.get("/projects2", projectController.projects2);
// router.get("/projects3", projectController.projects3);
// router.get("/projects/:id", projectController.projectsId);
// router.get("/project/:id", projectController.projectId);
// router.get("/project/crm/:id", projectController.projectCrmId);
// router.get("/projectall", projectController.projectAll);
// router.get("/projectscash", projectController.projectsCash)
// router.get("/projectnewdate", projectController.projectNewDate);
// router.get("/projectsnewcash", projectController.projectsNewCash)
// router.get("/projectsallnotion", projectController.projectsAllNotion);

//get MANAGERS
router.get("/managers", managerController.managers);                // все менеджеры с краткой информацией
// router.get("/managers2", managerController.managers2);              // все менеджеры с полной информацией
// router.get("/managers/:id", managerController.managersId);          // tgID менеджера по его UUID
// router.get("/managers/chat/:id", managerController.managersChatId); // UUID менеджера по его tgID
// router.get("/manager/:id", managerController.companyId);            // UUID компании по tgID менеджера
// router.get("/manager/name/:id", managerController.managerName);     // полная информация о менеджере по его UUID

// router.get("/managers/cash/:id", managerController.managerCash);     // получить данные менеджера из БД
// router.get("/managersall/cash", managerController.managerCashAll);     // получить всех менеджеров из БД
router.post('/managers/send/:id', managerController.sendAvatar)

//get COMPANYS
router.get("/companys", managerController.companys);
router.get("/company/:id", managerController.company);
router.get("/company/name/:id", managerController.companyName);

//-----------------POSTER ОТПРАВКА СМЕТЫ---------------------------------
router.post('/poster/send', posterController.sendPoster)
router.post('/poster/final/send', posterController.sendPosterFinal)

module.exports = router