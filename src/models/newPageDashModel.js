var database = require("../database/config");
const math = require("mathjs");

async function getDados(nomeEmpresa, nomeMaquina, nomeMetrica) {
    return (await getView(nomeEmpresa, nomeMaquina, nomeMetrica, true, true))[0];
}

async function getView(nomeEmpresa, nomeMaquina, nomeMetrica, order, limit) {
    let result;
    try {
        let sql = "SELECT * FROM `vw_" + nomeEmpresa + "_" + nomeMaquina + "_" + nomeMetrica + "`";
        if (order) {
            sql += ` ORDER BY dataColeta DESC `;
        }
        if (limit) sql += "LIMIT 10;"
        result = await database.executar(sql);
    } catch {
        result = [];
    }
    return result;
}

async function getMetricas() {
    return await database.executar(
        `SELECT nomeMetrica, unidadeDeMedida, isEstatico FROM Metrica`
    );
}

function getMaquinaInfo(fkEmpresa, fkMaquina) {
    let sql = `SELECT nomeMaquina, nomeEmpresa, hashMaquina, sistemaOperacional, onCloud, dataCriacao FROM Maquina JOIN Empresa on idEmpresa = Maquina.fkEmpresa WHERE idMaquina = ${fkMaquina} AND fkEmpresa = ${fkEmpresa} LIMIT 1`
    return database.executar(sql)
}
/* Anterior */
async function getMeanDates(fkEmpresa, fkMaquina, nomeMetrica) {
    let machine = await getMaquinaInfo(fkEmpresa, fkMaquina);
    let data = await getView(machine[0].nomeEmpresa, machine[0].nomeMaquina, nomeMetrica, true, false);
    let date = await separateDate(data);

    let res = {};
    for (let i = 0; i < date.length; i++) {
        let dataDate = getMathInformations(await getSeparatedDate(data, date[i]));
        if (res[date[i]] == undefined) res[date[i]] = {};
        res[date[i]][nomeMetrica] = dataDate;
    }
    return res;
}

async function separateDate(data, type = "date") {
    data = data.map(
        (item) => {
            let date = new Date(item.dataColeta);
            item.dataColeta = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();

            return item;
        }
    )
    let date = [];
    data = data.filter(
        (item) => {
            if (!date.includes(item.dataColeta)) {
                date.push(item.dataColeta);
                return true;
            }
            return false;
        }
    )
    
    return date
}

function getSeparatedDate(data, date) {
    return data.filter((item) => {
        return item.dataColeta == date;
    })
}

function getMathInformations(data) {
    let valueList = [];
    let value;
    
    for (let i = 0; i < data.length; i++) {
        value = parseFloat(data[i].valorLeitura);
        valueList.push(parseFloat(value.toFixed(2)));
    }

    return {
        mean: math.round(math.mean(valueList), 3),
        variance: math.round(math.variance(valueList, "uncorrected"), 3),
        standardDeviation: math.round(math.std(valueList), 3),
    }
    /* 
        Com Nada: - 1
        mean: 2002.2879356568365
        variance: 456664.5570700399
        Com uncorrected:  +- 0 Correto
        mean: 2002.2879356568365
        variance: 456419.6967177235 
        Com biased: + 1
        mean: 2002.2879356568365
        variance: 456175.09880951466
    */
}

/* Novo */
async function getMetricaInfoByDateHour(fkEmpresa, fkMaquina, nomeMetrica) {
    let machine = await getMaquinaInfo(fkEmpresa, fkMaquina);
    let data = await getView(machine[0].nomeEmpresa, machine[0].nomeMaquina, nomeMetrica, true, false);
    data = appendMean(joinHours(getDataByHour(data)));
    return data;
}

function getMathInformationsEnhanced(data) {
    return {
        mean: math.round(math.mean(data), 3),
        variance: math.round(math.variance(data, "uncorrected"), 3),
        standardDeviation: math.round(math.std(data), 3),
    }
    /* 
        Com Nada: - 1
        mean: 2002.2879356568365
        variance: 456664.5570700399
        Com uncorrected:  +- 0 Correto
        mean: 2002.2879356568365
        variance: 456419.6967177235 
        Com biased: + 1
        mean: 2002.2879356568365
        variance: 456175.09880951466
    */
}

function appendMean(data) {
    let keys = Object.keys(data);
    let newKey;

    for (let i = 0; i < keys.length; i++) {
        let hoursKeys = Object.keys(data[keys[i]]);
        for (let j = 0; j < hoursKeys.length; j++) {
            newKey = {};
            newKey.allData = data[keys[i]][hoursKeys[j]];
            newKey.math = getMathInformationsEnhanced(data[keys[i]][hoursKeys[j]]);

            data[keys[i]][hoursKeys[j]] = newKey;
        }
    }
    console.log("Mean adicionado")
    return data
}

function joinHours(data) {
    let dateKeys = Object.keys(data);

    for (let i = 0; i < dateKeys.length; i++) {
        let hourKeys = Object.keys(data[dateKeys[i]]);
        for (let j = 0; j < hourKeys.length; j++) {
            if (j % 2 != 0) {
                let lastHour = hourKeys[j - 1];

                if (lastHour == hourKeys[j] - 1) {
                    data[dateKeys[i]][`${lastHour}-${hourKeys[j]}`] = data[dateKeys[i]][lastHour].concat(data[dateKeys[i]][hourKeys[j]]);
                    delete data[dateKeys[i]][lastHour];
                    delete data[dateKeys[i]][hourKeys[j]];
                }
            }
        }
    }
    
    return data;
}
/* Muito processamento aqui, então divide pelo número de métricas */
function getDataByHour(data) {
    data = data.map(
        (item) => {
            let date = new Date(item.dataColeta);
            item.dataColeta =
                {
                    'date': date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear(),
                    'hour': date.getHours()
                };
            return item;
        }
    )

    let informations = {

    }
    data.forEach( 
        (item) => { 
            item.valorLeitura = parseFloat(item.valorLeitura);

            if (informations[item.dataColeta.date] == undefined) informations[item.dataColeta.date] = {};
            if (informations[item.dataColeta.date][item.dataColeta.hour] == undefined) informations[item.dataColeta.date][item.dataColeta.hour] = [];
            
            informations[item.dataColeta.date][item.dataColeta.hour].push(item.valorLeitura)
        }
            
    )
    console.log("Finalizado carregamento de dados");
    return informations
}
module.exports = {
    getDados,
    getView,
    getMetricas,
    getMeanDates,
    getMetricaInfoByDateHour
} 