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
async function getMeanHours2(req, res) {
    console.log("Inicio: " + `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);

    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;
    let metricas = await dashModel.getMetricas();
    let allPromises = [];
    let machine = await dashModel2.getMaquinaInfo(fkEmpresa, fkMaquina);
    for (let i = 0; i < metricas.length; i++) {
        if (metricas[i].isEstatico == 0) {
            if (machine[0].sistemaOperacional == "Windows" && metricas[i].nomeMetrica == "cpu_Temperature") continue;
            if (metricas[i].nomeMetrica != "cpu_Utilizacao" && metricas[i].nomeMetrica != "ram_Usada") continue;
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

        console.log("Fim: " + `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);

        res.json(dates);
    });

}

async function getMeanHours(req, res) {
    console.log("Inicio: " + `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);

    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;
    let metricas = await dashModel.getMetricas();
    let allPromises = [];
    let machine = await dashModel2.getMaquinaInfo(fkEmpresa, fkMaquina);
    let dataTime = await dashModel.getDataTime(fkEmpresa, fkMaquina);

    let response = {};

    for (let i = 0; i < dataTime.length; i++) {
        let date = new Date(dataTime[i].onlyDay);
        date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        response[`${date}-${dataTime[i].onlyHour}`] = {};
        let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, date, dataTime[i].onlyHour, metricas);
    }

    console.log(response);


    /* for (let i = 0; i < 1; i++) {
        let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, dataTime[i]);
    }

    for (let i = 0; i < metricas.length; i++) {
        if (metricas[i].isEstatico == 0) {
            if (machine[0].sistemaOperacional == "Windows" && metricas[i].nomeMetrica == "cpu_Temperature") continue;
            if (metricas[i].nomeMetrica != "cpu_Utilizacao" && metricas[i].nomeMetrica != "ram_Usada") continue;
            
            for (let i = 0; i < times.length; i++) { 
            }
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

        console.log("Fim: " + `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);

        res.json(dates);
    }); */

}

module.exports = {
    getDados,
    getMeanHours
}