var dashModel = require("../models/newPageDashModel")
var dashModel2 = require("../models/dashModel")
const { Worker } = require('worker_threads')

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
    console.log("Inicio: " + `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;
    let metricas = await dashModel.getMetricas();
    let allPromises = [];
    let machine = await dashModel2.getMaquinaInfo(fkEmpresa, fkMaquina);
    metricas.forEach(
        (metrica, i) => {


            if (metricas[i].isEstatico == 0) {
                if (machine[0].sistemaOperacional == "Windows" && metricas[i].nomeMetrica == "cpu_Temperature") return;
                if (metricas[i].nomeMetrica != "cpu_Utilizacao" && metricas[i].nomeMetrica != "ram_Usada") return;
                runService({
                    nomeEmpresa: machine[0].nomeEmpresa,
                    nomeMaquina: machine[0].nomeMaquina,
                    nomeMetrica: metrica.nomeMetrica
                });


            }
        }
    )

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
        console.log("Fim: " + `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
        res.json(dates);
    });

}

function runService(workerData) {
    return new Promise((resolve, reject) => {
        let workers = new Worker("worker.js", {
            workerData
        });
    });
    
    let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, metricas[i].nomeMetrica);
    worker
}

module.exports = {
    getDados,
    getMeanHours
}