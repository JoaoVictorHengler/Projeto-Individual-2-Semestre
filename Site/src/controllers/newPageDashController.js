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
async function getMeanHours(req, res, type = "get") {
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

    let machineInfo = (await dashModel2.getMaquinaInfo(fkEmpresa, fkMaquina))[0];


    await dashModel.createViewAllStats(fkEmpresa, fkMaquina, machineInfo.nomeEmpresa, machineInfo.nomeMaquina);

    let data = await dashModel.getDataTime(machineInfo.nomeEmpresa, machineInfo.nomeMaquina);

    data.map(
        (item) => {
            item.onlyDay = new Date(item.onlyDay)
            item.onlyDay = `${item.onlyDay.getFullYear()}-${item.onlyDay.getMonth() + 1}-${item.onlyDay.getDate()}`;
            return item;
        }
    )

    let response = await dashModel.getMetricaInfoByDateHour(machineInfo.nomeEmpresa, machineInfo.nomeMaquina, data, metricas);
    let datesOrdened = Object.keys(response).sort(
        (a, b) => {
            return new Date(a) - new Date(b);
        }
    )

    let response2 = {};
    for (let date of datesOrdened) {
        let dateFormated = new Date(date);
        dateFormated = `${dateFormated.getDate()}/${dateFormated.getMonth() + 1}/${dateFormated.getFullYear()}`;
        response2[dateFormated] = response[date];
    }
    response = response2;
    let fim = new Date();
    console.log("Fim: " + `${fim.getHours()}:${fim.getMinutes()}:${fim.getSeconds()}`);
    console.log("Tempo: " + (fim.getTime() - inicio.getTime()) / 1000 + "s");

    if (type == "get") response = {
        "nomeMaquina": machineInfo.nomeMaquina,
        "hashMaquina": machineInfo.hashMaquina,
        response: response
    };

    if (type != "predict") res.json(response);
    else return response; 

    /* data.forEach(
        (item) => {
            if (response[item.onlyDay] == undefined) response[item.onlyDay] = {};
            if (response[item.onlyDay][item.onlyHour] == undefined) response[item.onlyDay][item.onlyHour] = {};
            
            
        }
    )

    let values = await Promise.all(allPromises);
    values.forEach((result) => {
        response[`${result.date}`][`${result.hour}`] = result.result;
    });

    
    
    console.log("Tipo: ", type);
    */
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