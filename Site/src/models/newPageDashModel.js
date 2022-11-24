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
    return database.executar(
        `SELECT * FROM Metrica`
    );
}

function getMaquinaInfo(fkEmpresa, fkMaquina) {
    let sql = `SELECT nomeMaquina, nomeEmpresa, hashMaquina, sistemaOperacional, onCloud, dataCriacao FROM Maquina JOIN Empresa on idEmpresa = Maquina.fkEmpresa WHERE idMaquina = ${fkMaquina} AND fkEmpresa = ${fkEmpresa} LIMIT 1`
    return database.executar(sql)
}

function getDataTime(fkEmpresa, fkMaquina) {
    let res = database.executar(`select Distinct DATE(dataColeta) as 'onlyDay', HOUR(dataColeta) as 'onlyHour' from leitura AS L1 WHERE L1.fkMaquina = ${fkMaquina} AND L1.fkEmpresa = ${fkEmpresa} order by dataColeta limit 24;`);
    return res;
}

function getDataByHour(fkMaquina, fkEmpresa, data, hora) {
    let res = database.executar(`SELECT fkMetrica, DATE(dataColeta) as 'onlyDay', HOUR(dataColeta) as 'onlyHour',
    MINUTE(dataColeta) as 'onlyMinutes', SECOND(dataColeta) as 'onlySeconds', valorLeitura FROM Leitura AS L2
		where L2.fkMaquina = ${fkMaquina} and L2.fkEmpresa = ${fkEmpresa}
		and HOUR(L2.dataColeta) = ${hora} AND DATE(L2.dataColeta) = '${data}' and valorLeitura != -500.00 order by fkMetrica;`);
    return res;
}

/* Novo */
async function getMetricaInfoByDateHour(fkEmpresa, fkMaquina, data, hora, metricas) {
    let res = await getDataByHour(fkMaquina, fkEmpresa, data, hora);
    let result = {}, resultFiltered = {};
    res.forEach((item, i) => {
        let metrica = metricas.find((metrica) => metrica.idMetrica == item.fkMetrica);

        if (result[metrica.nomeMetrica] == undefined) {
            result[metrica.nomeMetrica] = {};
            resultFiltered[metrica.nomeMetrica] = {};
        }
        let date = new Date(item.onlyDay);

        date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        result[metrica.nomeMetrica][`${date}-${item.onlyHour}:${item.onlyMinutes}:${item.onlySeconds}`] = parseFloat(item.valorLeitura);
    });

    resultFiltered = reduceSeconds(result, resultFiltered);

    Object.keys(resultFiltered).forEach(
        (metrica) => {
            let item = resultFiltered[metrica];
            let data = Object.keys(item).map((key) => {
                return {
                    date: key,
                    mean: item[key].mean,
                    variance: item[key].totalVariance,
                    length: item[key].totalLength
                }
            });
            let meanList = data.map((item) => {
                return item.mean;
            });
            let math = getMathInformationsEnhanced(meanList);
            resultFiltered[metrica] = {
                math: math,
                data: data
            }
        }
    )
    
    return {
        date: data,
        hour: hora,
        result: resultFiltered
    };
}

function reduceSeconds(result, resultFiltered) {
    let init = 0;
    for (let metrica in result) {
        let listData = Object.keys(result[metrica]);
        for (let i = 0; i < listData.length; i++) {
            let totalVariance = 0;
            let totalLength = 0;
            if (i > 0) {
                let item = listData[i];

                let itemDate = new Date(item.split("-").join(" "));
                let prevItemDate = new Date(listData[i - 1].split("-").join(" "));
                if (`${itemDate.getHours()}:${itemDate.getMinutes()}` != 
                `${prevItemDate.getHours()}:${prevItemDate.getMinutes()}` ||
                `${itemDate.getDate()}/${itemDate.getMonth()}/${itemDate.getFullYear()}` != 
                `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()}`) {
                    let dateMeaned = `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()} ${prevItemDate.getHours()}:${prevItemDate.getMinutes()}:00`;
                    let allDataToMean = [];
                    for (let j = i; j > init; j--) {
                        allDataToMean.push(result[metrica][listData[j]]);
                        totalLength++;

                    }   
                    if (allDataToMean.length == 0) {
                        allDataToMean.push(result[metrica][listData[i]]);
                        totalLength++;
                    }
                    let math = getMathInformationsEnhanced(allDataToMean);
                    resultFiltered[metrica][dateMeaned] = {
                        mean: math.mean,
                        totalLength: totalLength,
                        totalVariance: math.variance,
                    };
                    

                    init = i;
                }
            }
        }
    }
    return resultFiltered;
}

/* Antigo:
async function getMetricaInfoByDateHour(fkEmpresa, fkMaquina, nomeMetrica) {
    let machine = await getMaquinaInfo(fkEmpresa, fkMaquina);
    let data = await getView(machine[0].nomeEmpresa, machine[0].nomeMaquina, nomeMetrica, true, false);
    data = await reduceSeconds(data);
    
    return {
        metrica: nomeMetrica,
        data: data
    };
}

function reduceSeconds(data) {
    let newData = [];
    let sameDate = [];

    data.forEach(
        (item, i, arr) => {
            let itemDate = new Date(item.dataColeta);
            if (i >= 1) {
                let lastItemDate = new Date(arr[i - 1].dataColeta);
                if (lastItemDate.getDate() == itemDate.getDate() && lastItemDate.getMonth() == itemDate.getMonth() && lastItemDate.getFullYear() == itemDate.getFullYear() && lastItemDate.getHours() == itemDate.getHours() && lastItemDate.getMinutes() == itemDate.getMinutes()) {
                    return;
                }
            }
            sameDate.push(item);
        });
    

    sameDate.forEach ( (item) => {
        let itemDate = new Date(item.dataColeta);
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
} */

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
    getMetricaInfoByDateHour,
    getDataTime
} 