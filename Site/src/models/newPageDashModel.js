var database = require("../database/config");
const MLR = require("ml-regression-multivariate-linear");
const math = require("mathjs");

async function getMetricas() {
    return await database.executar(
        `SELECT * FROM Metrica`
    );
}

async function getDataTime(nomeEmpresa, nomeMaquina) {
    let res = await database.executar(`select Distinct DATE(dataColeta) as 'onlyDay', HOUR(dataColeta) as 'onlyHour' 
    from `+ "`vw_" + nomeEmpresa + "_" + nomeMaquina + "`" + ` order by dataColeta limit 24;`);

    return res;
}

async function createViewAllStats(fkEmpresa, fkMaquina, nomeEmpresa, nomeMaquina) {
    let sql = "CREATE OR REPLACE VIEW" + " `vw_" + nomeEmpresa + "_" + nomeMaquina + "` ";
    sql += `AS SELECT nomeMaquina, nomeComponente, nomeMetrica, fkMetrica, unidadeDeMedida, isEstatico,
    dataColeta, valorLeitura FROM Leitura JOIN Componente on idComponente = Leitura.fkComponente 
    JOIN Metrica on idMetrica = Leitura.fkMetrica JOIN Maquina on idMaquina = Leitura.fkMaquina 
    and Maquina.fkEmpresa = ${fkEmpresa}  and Maquina.idMaquina = ${fkMaquina};`
    return await database.executar(sql);
}

async function getDataByHour(nomeEmpresa, nomeMaquina) {
    return await database.executar(`
    SELECT Distinct fkMetrica, date_format(dataColeta, '%Y-%m-%d') as 'diaInteiro', HOUR(dataColeta) as 'hora', MINUTE(dataColeta) as 'minuto', SECOND(dataColeta) as 'segundo', valorLeitura
    from ` + "`vw_" + nomeEmpresa + "_" + nomeMaquina + "`" + ` AS V1 where valorLeitura != -500.00 order by fkMetrica`);
}

/* Novo */
async function getMetricaInfoByDateHour(nomeEmpresa, nomeMaquina, data, metricas) {

    let res = await getDataByHour(nomeEmpresa, nomeMaquina);
    let result = {}

    res.map((item, i) => {
        console.log(item)
        if (i > 0) {
            let itemDate = new Date(
                item.diaInteiro + `${item.hora}:${item.minuto}:${item.segundo}`
            );
            let prevItemDate = new Date(
                res[i - 1].diaInteiro + `${res[i - 1].hora}:${res[i - 1].minuto}:${item.segundo}`
            );
            if (`${itemDate.getHours()}:${itemDate.getMinutes()}` !=
                `${prevItemDate.getHours()}:${prevItemDate.getMinutes()}` ||
                `${itemDate.getDate()}/${itemDate.getMonth()}/${itemDate.getFullYear()}` !=
                `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()}` ||
                i == res.length - 1) {
                let dateMeaned = `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()} ${prevItemDate.getHours()}:${prevItemDate.getMinutes()}:00`;
                return {
                    fkMetrica: item.fkMetrica,
                    valorLeitura: parseFloat(item.valorLeitura),
                    dataColeta: dateMeaned
                }
            }
        } 
        
    });
    console.log(res)

    metricas.forEach(
        (metrica) => {
            if (metrica.isEstatico == 1) return;

            result[metrica.nomeMetrica] = {};
            let metricaData = res.filter((x) => { return x.fkMetrica == metrica.idMetrica; });

            metricaData.map(
                (item, i) => {
                    let itemDate = new Date(item.dataColeta.split("-").join(" "));
                    let prevItemDate = new Date(metricaData[i - 1].dataColeta.split("-").join(" "));
                    if (`${itemDate.getHours()}:${itemDate.getMinutes()}` !=
                        `${prevItemDate.getHours()}:${prevItemDate.getMinutes()}` ||
                        `${itemDate.getDate()}/${itemDate.getMonth()}/${itemDate.getFullYear()}` !=
                        `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()}` ||
                        i == listData.length - 1) {
                        let dateMeaned = `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()} ${prevItemDate.getHours()}:${prevItemDate.getMinutes()}:00`;
                        return {
                            valorLeitura: parseFloat(item.valorLeitura),
                            dataColeta: dateMeaned
                        }
                    }
                }
            )
            result[metrica.nomeMetrica].allData = metricaData
        }
    )
    console.log(result)
    let resultFiltered = {};
    let resultFiltered2 = result;
    let init = 0;
    /* Object.keys(result).forEach(
        (item, i) => {
            item = result[item];
            if (`${itemDate.getHours()}:${itemDate.getMinutes()}` !=
                `${prevItemDate.getHours()}:${prevItemDate.getMinutes()}` ||
                `${itemDate.getDate()}/${itemDate.getMonth()}/${itemDate.getFullYear()}` !=
                `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()}` ||
                i == listData.length - 1) {
    
            
            let allDataToMean = [];
            for (let j = i; j > init; j--) {
                allDataToMean.push(result[item.nomeMetrica][listData[j]]);
                totalLength++;
    
            }
            if (allDataToMean.length == 0) {
                allDataToMean.push(result[metrica][listData[i]]);
                totalLength++;
            }
        }
    
        }
    ) */

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

    let y = [...Array(data.length + 1).keys()].map((x) => { if (x > 0) return [x]; }).filter((x) => { return x !== undefined });

    let model = new MLR(y, data);

    let result = model.predict([y[y.length - 1][0] + 1]);

    return result;

}
module.exports = {
    getMetricas,
    getMetricaInfoByDateHour,
    getDataTime,
    predictWithMl,
    createViewAllStats
} 