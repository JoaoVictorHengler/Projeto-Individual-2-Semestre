var database = require("../database/config");
const MLR = require("ml-regression-multivariate-linear");
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
        if (metrica.nomeMetrica != "cpu_Frequencia_Maxima" && metrica.nomeMetrica != "cpu_Frequencia_Minima" && metrica.nomeMetrica != "ram_Total" && metrica.nomeMetrica != "disco_Total") {

            if (result[metrica.nomeMetrica] == undefined) {
                result[metrica.nomeMetrica] = {};
                resultFiltered[metrica.nomeMetrica] = {};
            }
            let date = new Date(item.onlyDay);

            date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

            result[metrica.nomeMetrica][`${date}-${item.onlyHour}:${item.onlyMinutes}:${item.onlySeconds}`] = parseFloat(item.valorLeitura);
        };


    });

    resultFiltered = reduceSeconds(result, resultFiltered);

    Object.keys(resultFiltered).forEach(
        async (metrica) => {
            if (metrica != "cpu_Frequencia_Maxima" && metrica != "cpu_Frequencia_Minima" && metrica != "ram_Total" && metrica != "disco_Total") {
                let item = resultFiltered[metrica];

                
                    let data = Object.keys(item).map((key) => {
                        return {
                            date: key,
                            mean: item[key].mean,
                            variance: item[key].totalVariance,
                            stdError: item[key].totalStandardDeviationError,
                            length: item[key].totalLength,
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
        if (metrica != "cpu_Frequencia_Maxima" && metrica != "cpu_Frequencia_Minima" && metrica != "ram_Total" && metrica != "disco_Total") {
            let listData = Object.keys(result[metrica]);
            for (let i = 0; i < listData.length; i++) {

                let totalLength = 0;
                if (i > 0) {
                    let item = listData[i];

                    let itemDate = new Date(item.split("-").join(" "));
                    let prevItemDate = new Date(listData[i - 1].split("-").join(" "));
                    if (`${itemDate.getHours()}:${itemDate.getMinutes()}` !=
                        `${prevItemDate.getHours()}:${prevItemDate.getMinutes()}` ||
                        `${itemDate.getDate()}/${itemDate.getMonth()}/${itemDate.getFullYear()}` !=
                        `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()}` ||
                        i == listData.length - 1) {
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
                            totalStandardDeviationError: math.standardDeviation
                        };


                        init = i;
                    }
                }
            }
        }
    }
    return resultFiltered;
}

function getMathInformationsEnhanced(data) {
    return {
        mean: math.round(math.mean(data), 3),
        variance: math.round(math.variance(data, "uncorrected"), 3),
        standardDeviation: math.round(math.std(data), 3),
    }
}

/* ---------------------------------------------------------------------------------------------------------- */
function predictWithMl(data) {
    
    let y = [...Array(data.length + 1).keys()].map( (x) => {if (x > 0) return [x];}).filter( (x) => {return x !== undefined});
    
    let model = new MLR(y, data);
    
    let result = model.predict([y[y.length - 1][0] + 1]);
    
    return result;

}
module.exports = {
    getDados,
    getView,
    getMetricas,
    getMetricaInfoByDateHour,
    getDataTime,
    predictWithMl
} 