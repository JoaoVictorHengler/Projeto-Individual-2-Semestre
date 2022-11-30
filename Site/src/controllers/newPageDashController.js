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
async function getMeanHours(req, res, type="get") {
    let inicio = new Date();
    console.log("Inicio: " + `${inicio.getHours()}:${inicio.getMinutes()}:${inicio.getSeconds()}`);
    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;

    if (fkMaquina == undefined) {
        res.status(400).json({ "result": "fkMaquina não foi passado como parâmetro" });
        return { "result": "fkMaquina não foi passado como parâmetro" };
    } else if (fkEmpresa == undefined) {
        res.status(400).json({ "result": "fkEmpresa não foi passado como parâmetro" });
        return { "result": "fkEmpresa não foi passado como parâmetro" };
    }
    
    let allPromises = [];
    let metricas = await dashModel.getMetricas();
    let dataTime = await dashModel.getDataTime(fkEmpresa, fkMaquina);
    let machineInfo = await dashModel2.getMaquinaInfo(fkEmpresa, fkMaquina);

    let response = {};

    for (let i = 0; i < dataTime.length; i++) {
        let date = new Date(dataTime[i].onlyDay);
        date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        response[`${date}`] = {};
        response[`${date}`][`${dataTime[i].onlyHour}`] = {};
        let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, date, dataTime[i].onlyHour, metricas);
        
        allPromises.push(dateMetrica);
    }

    let values = await Promise.all(allPromises);
    values.forEach((result) => {
        response[`${result.date}`][`${result.hour}`] = result.result;
    });

    if (type == "get") {
        response = {
            "nomeMaquina": machineInfo[0].nomeMaquina,
            "hashMaquina": machineInfo[0].hashMaquina,
            response: response
        };
    }
    let fim = new Date();
    console.log("Fim: " + `${fim.getHours()}:${fim.getMinutes()}:${fim.getSeconds()}`);
    console.log("Tempo: " + (fim.getTime() - inicio.getTime()) / 1000 + "s");
    console.log("Tipo: ", type);
    if (type != "predict") res.json(response);    
    else return response;
}

async function predictWithMl(req, res) {    
    let response = {};
    
    let data = await getMeanHours(req, res, "predict")
    let predictDataArray = {};
    for (let date in data) {
        
        for (let hour in data[date]) {
            for (let metrica in data[date][hour]) {
                if (predictDataArray[metrica] == undefined) predictDataArray[metrica] = [];
                predictDataArray[metrica].push([data[date][hour][metrica].math.mean]);  
            }
        }
    }


    for (let metrica in predictDataArray) {
        for (let i = 0; i < 5; i++) {
            /* console.log("Metrica: " + metrica); */
            if (response[metrica] == undefined) response[metrica] = [];
            let predictResult = await dashModel.predictWithMl(predictDataArray[metrica], metrica);
            response[metrica].push(predictResult[0]);
            predictDataArray[metrica].push(predictResult);
        }
    }

    res.json(response);
}

module.exports = {
    getDados,
    getMeanHours,
    predictWithMl
}