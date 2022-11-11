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
    data = await reduceSeconds(data);
    console.log("Promessa Concluída")
    return {
        metrica: nomeMetrica,
        data: data
    };
}

function reduceSeconds(data) {
    let newData = [];

    data.forEach(
        (item, i, arr) => {
            let itemDate = new Date(item.dataColeta);
            if (i >= 1) {
                let lastItemDate = new Date(arr[i - 1].dataColeta);
                if (lastItemDate.getDate() == itemDate.getDate() && lastItemDate.getMonth() == itemDate.getMonth() && lastItemDate.getFullYear() == itemDate.getFullYear() && lastItemDate.getHours() == itemDate.getHours() && lastItemDate.getMinutes() == itemDate.getMinutes()) {
                    return;
                }
            }


            let dataFilteredForMinutes = (data.filter(
                (item2) => {
                    let date2 = new Date(item2.dataColeta);
                    return date2.getDate() == itemDate.getDate() && date2.getMonth() == itemDate.getMonth() && date2.getFullYear() == itemDate.getFullYear() && date2.getHours() == itemDate.getHours() && date2.getMinutes() == itemDate.getMinutes();
                }
            ))

            let mean = math.mean(dataFilteredForMinutes.map((item) => { return parseFloat(item.valorLeitura) }));
            newData.push({
                nomeMaquina: item.nomeMaquina,
                nomeComponente: item.nomeComponente,
                nomeMetrica: item.nomeMetrica,
                unidadeDeMedida: item.unidadeDeMedida,
                dataColeta: {
                    date: itemDate.getDate() + "/" + (itemDate.getMonth() + 1) + "/" + itemDate.getFullYear(),
                    hour: itemDate.getHours()
                },
                valorLeitura: mean
            });
        });
    
    return getDataByHour(newData);
}

function getDataByHour(data) {
    let dataSeparatedByHour = {};
    
    data.forEach(
        (item) => {
            item.valorLeitura = parseFloat(item.valorLeitura);

            if (dataSeparatedByHour[item.dataColeta.date] == undefined) dataSeparatedByHour[item.dataColeta.date] = {};
            if (dataSeparatedByHour[item.dataColeta.date][item.dataColeta.hour] == undefined) dataSeparatedByHour[item.dataColeta.date][item.dataColeta.hour] = [];

            dataSeparatedByHour[item.dataColeta.date][item.dataColeta.hour].push(item.valorLeitura)
        }

    )
    return appendMean(dataSeparatedByHour)
}

function appendMean(data) {
    Object.keys(data).forEach(
        (key) => {
            let hoursKeys = Object.keys(data[key]);
            hoursKeys.forEach(
                (hour) => {
                    data[key][hour] = getMathInformationsEnhanced(data[key][hour]);
                })
        });
    return data
}

function getMathInformationsEnhanced(data) {
    return {
        mean: math.round(math.mean(data), 3),
        variance: math.round(math.variance(data, "uncorrected"), 3),
        standardDeviation: math.round(math.std(data), 3),
    }
}

module.exports = {
    getDados,
    getView,
    getMetricas,
    getMeanDates,
    getMetricaInfoByDateHour
} 