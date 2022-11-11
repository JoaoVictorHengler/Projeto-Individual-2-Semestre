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
/* Novo */
async function getMeanHours(req, res) {
    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;
    let metricas = await dashModel.getMetricas();
    let allPromises = [];
    let machine = await dashModel2.getMaquinaInfo(fkEmpresa, fkMaquina);
    for (let i = 0; i < metricas.length; i++) {
        if (metricas[i].isEstatico == 0) {
            if (machine[0].sistemaOperacional == "Windows" && metricas[i].nomeMetrica == "cpu_Temperature") continue;
            if (metricas[i].nomeMetrica != "cpu_Utilizacao") continue;
            let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, metricas[i].nomeMetrica);
            allPromises.push(dateMetrica);
            console.log("Promessa Iniciada...")
        }
    }

    Promise.all(allPromises).then((values) => {
        console.log("Promessas Concluídas!")
        let dates = {};
        values.forEach(
            (result) => {
                Object.keys(result.data).forEach(
                    (key) => {
                        if (dates[key] == undefined) dates[key] = {};
                        Object.keys(result.data[key]).forEach(
                            (hour) => {
                                if (dates[key][hour] == undefined) dates[key][hour] = {};
                                if (dates[key][hour][result.metrica] == undefined) dates[key][hour][result.metrica] = {};
                                dates[key][hour][result.metrica] = result.data[key][hour];
                            });
                    }
                )
            }
        )
        console.log(dates)
        let response = { "a": values[0] };
        /* for (let i = 0; i < values.length; i++) {
            response[values[i].metrica] = values[i].data;
        } */

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