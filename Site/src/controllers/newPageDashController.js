var dashModel = require("../models/newPageDashModel")

async function getDados(req, res) {
    let fkEmpresa = req.body.fkEmpresa;
    let fkMaquina = req.body.fkMaquina;
    let nomeMetrica = req.body.nomeMetrica;
    
    let maquinaInfo = await dashModel.getMaquinaInfo(fkEmpresa, fkMaquina);
    let response = await dashModel.getDados(maquinaInfo[0].nomeEmpresa, maquinaInfo[0].nomeMaquina, nomeMetrica);
    res.json({"metricas": response});
}
/* Novo */
async function getMeanHours(req, res) {
    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;
    let metricas = await dashModel.getMetricas();
    let allPromises = [];
    for (let i = 0; i < metricas.length; i++) {
        if (metricas[i].isEstatico == 0) {

            let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, metricas[i].nomeMetrica);
            allPromises.push(dateMetrica);
        }
    }
    
    Promise.all(allPromises).then((values) => {
        let response = {};
        for (let i = 0; i < values.length; i++) {
            response[values[i].metrica] = values[i].data;
        }

        res.json(response);
    });

}

async function getDataDate(req, res) {
    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;

    let metricas = await dashModel.getMetricas();
    let response = {};
    for (let i = 0; i < metricas.length; i++) {
        let dateMetrica = await dashModel.getMeanDates(fkEmpresa, fkMaquina, metricas[i].nomeMetrica);

        for (let key in dateMetrica) {
            if (response[key] == undefined) response[key] = {};
            response[key][metricas[i].nomeMetrica] = dateMetrica[key][metricas[i].nomeMetrica];
        }
    }
    res.json(response);
}

module.exports = {
    getDados,
    getDataDate,
    getMeanHours
}