var express = require("express")
var router = express.Router()

var dashController = require("../controllers/newPageDashController");

router.get("/getDataByDate/:fkMaquina&:fkEmpresa", function(req, res) {
    dashController.getDataDate(req, res)
})
router.get("/teste/?msg=:msg", function(req, res) {
    res.json(
        {
            "msg": req.params.msg
        }
    )
})

module.exports = router