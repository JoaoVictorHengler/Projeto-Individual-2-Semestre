var dashModel = require("../models/newPageDashModel")
var dashModel2 = require("../models/dashModel")

async function getDados(req, res) {
    let fkEmpresa = req.body.fkEmpresa;
    let fkMaquina = req.body.fkMaquina;
    let nomeMetrica = req.body.nomeMetrica;

    let maquinaInfo = await dashModel2.getMaquinaInfo(fkEmpresa, fkMaquina);
    let response = await dashModel.getDados(maquinaInfo[0].nomeEmpresa, maquinaInfo[0].nomeMaquina, nomeMetrica);
    res.json({ "metricas": response });
}
/* 
   Tempo antigo: ~11s 
   Tempo Novo: ~6.84s
   Diferença de ~38% na velocidade
*/
async function getMeanHours(req, res) {
    
    let inicio = new Date();
    console.log("Inicio: " + `${inicio.getHours()}:${inicio.getMinutes()}:${inicio.getSeconds()}`);
    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;
    
    let allPromises = [];
    let metricas = await dashModel.getMetricas();
    let dataTime = await dashModel.getDataTime(fkEmpresa, fkMaquina);

    let response = {};

    for (let i = 0; i < dataTime.length; i++) {
        let date = new Date(dataTime[i].onlyDay);
        date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        response[`${date}`] = {};
        response[`${date}`][`${dataTime[i].onlyHour}`] = {};
        let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, date, dataTime[i].onlyHour, metricas);
        
        allPromises.push(dateMetrica);
    }

    Promise.all(allPromises).then((values) => {
        values.forEach((result) => {
            response[`${result.date}`][`${result.hour}`] = result.result;
        });
        let fim = new Date();
        console.log("Fim: " + `${fim.getHours()}:${fim.getMinutes()}:${fim.getSeconds()}`);
        console.log("Tempo: " + (fim.getTime() - inicio.getTime()) / 1000 + "s");
        res.json(response);
    });
}
module.exports = {
    getDados,
    getMeanHours
}