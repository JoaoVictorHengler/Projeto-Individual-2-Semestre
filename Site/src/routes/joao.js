var express = require("express")
var router = express.Router()

var dashController = require("../controllers/newPageDashController");

/* router.get("/getDataByDate/:fkMaquina&:fkEmpresa", function(req, res) {
    dashController.getDataDate(req, res)
}) */
/* Novo */

router.get("/getInformationsByDateHour/:fkMaquina&:fkEmpresa", function(req, res) {
    dashController.getMeanHours(req, res);
})
router.get("/teste/?msg=:msg", function(req, res) {
    res.json(
        {
            "msg": req.params.msg
        }
    )
})

router.get("/predictWithMl/:fkMaquina&:fkEmpresa", (req, res) => {
    dashController.predictWithMl(req, res);
})

module.exports = router