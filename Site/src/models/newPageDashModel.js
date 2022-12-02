var database = require("../database/config");
const MLR = require("ml-regression-multivariate-linear");
const math = require("mathjs");

async function getMetricas() {
    return await database.executar(
        `SELECT * FROM Metrica`
    );
}

async function getDataTime(nomeEmpresa, nomeMaquina) {
    let res = await database.executar(`select Distinct diaInteiro, hora 
    from `+ "`vw_" + nomeEmpresa + "_" + nomeMaquina + "`" + ` order by timestamp(CONCAT(diaInteiro, ' ', hora, ':', minuto, ':', segundo)) limit 24;`);

    return res;
}

async function createViewAllStats(fkEmpresa, fkMaquina, nomeEmpresa, nomeMaquina) {
    let sql = "CREATE OR REPLACE VIEW" + " `vw_" + nomeEmpresa + "_" + nomeMaquina + "` ";
    sql += `AS SELECT Distinct fkMetrica, date_format(dataColeta, '%Y-%m-%d') as 'diaInteiro', 
    HOUR(dataColeta) as 'hora', MINUTE(dataColeta) as 'minuto', SECOND(dataColeta) as 'segundo',
    valorLeitura FROM Leitura JOIN Metrica on idMetrica = fkMetrica and isEstatico = 0 WHERE fkEmpresa = ${fkEmpresa} and fkMaquina = ${fkMaquina}
    and valorLeitura != -500.00 and dataColeta > 
    (SELECT dataColeta from Leitura where  fkMaquina = 1 & fkEmpresa = 1 order by dataColeta desc limit 1) 
    - interval 3 day order by dataColeta desc;`
    return await database.executar(sql);
}

async function getDataByHour(nomeEmpresa, nomeMaquina) {
    return await database.executar(`
    SELECT fkMetrica, diaInteiro, hora, minuto, segundo, valorLeitura
    from ` + "`vw_" + nomeEmpresa + "_" + nomeMaquina + "`" + ` order by fkMetrica`);
}

/* Novo */
async function getMetricaInfoByDateHour(nomeEmpresa, nomeMaquina, data, metricas) {
    /* let last24Hours = await database.executar(`
    SELECT fkMetrica, diaInteiro, hora, minuto, segundo, valorLeitura
    from ` + "`vw_" + nomeEmpresa + "_" + nomeMaquina + "`" + ` where diaInteiro = '${data}' order by fkMetrica`);
    ; */
    let res = await getDataByHour(nomeEmpresa, nomeMaquina);
    let resultFiltered = {};
    
    res = getLastHourData(res);

    let init = 0;

    res.forEach(
        (item, i) => {
            if (i > 0 && item !== undefined) {
                let metricaNome = metricas.find((metrica) => {
                    return metrica.idMetrica == item.fkMetrica;
                }).nomeMetrica;


                let itemDate = new Date(item.dataColeta);
                let prevItemDate = new Date(res[i - 1].dataColeta);

                if (`${itemDate.getHours()}` !=
                    `${prevItemDate.getHours()}` ||
                    `${itemDate.getDate()}/${itemDate.getMonth()}/${itemDate.getFullYear()}` !=
                    `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()}` ||
                    i == res.length - 1) {
                    let allDataHour = {};

                    let itemDate;
                    for (let j = init, len = i ; j < len ; j++) {
                        itemDate = new Date(res[j].dataColeta);
                        itemDate = `${itemDate.getDate()}/${itemDate.getMonth() + 1}/${itemDate.getFullYear()} ${itemDate.getHours()}:${itemDate.getMinutes()}:00`
                        allDataHour[itemDate] = res[j].valorLeitura;
                    }
                    
                    let dateMeaned = `${prevItemDate.getMonth()+1}/${prevItemDate.getDate()}/${prevItemDate.getFullYear()}`;
                    if (resultFiltered[dateMeaned] === undefined) resultFiltered[dateMeaned] = {};
                    if (resultFiltered[dateMeaned][prevItemDate.getHours()] === undefined) resultFiltered[dateMeaned][prevItemDate.getHours()] = {};
                    if (resultFiltered[dateMeaned][prevItemDate.getHours()][metricaNome] == undefined) resultFiltered[dateMeaned][prevItemDate.getHours()][metricaNome] = {};
                    let mathInfo = getMathInformationsEnhanced(
                        Object.keys(allDataHour).map((item) => {
                            return allDataHour[item];
                        })
                    );  
                    resultFiltered[dateMeaned][prevItemDate.getHours()][metricaNome] = {
                        math: mathInfo,
                        allDataHour: allDataHour
                    }
                    init = i;
                }
            }
        }
    )
    let fim = new Date();
    console.log("Etapa 2 Terminada: " + `${fim.getHours()}:${fim.getMinutes()}:${fim.getSeconds()}`)

    return resultFiltered

}

function getLastHourData(res) {
    res = res.map((item, i) => {
        if (i > 0) {
            let itemDate = new Date(
                item.diaInteiro + ` ${item.hora}:${item.minuto}:${item.segundo}`
            );
            let prevItemDate = new Date(
                res[i - 1].diaInteiro + ` ${res[i - 1].hora}:${res[i - 1].minuto}:${item.segundo}`
            );
            if (`${itemDate.getHours()}:${itemDate.getMinutes()}` !=
                `${prevItemDate.getHours()}:${prevItemDate.getMinutes()}` ||
                `${itemDate.getDate()}/${itemDate.getMonth()}/${itemDate.getFullYear()}` !=
                `${prevItemDate.getDate()}/${prevItemDate.getMonth()}/${prevItemDate.getFullYear()}` ||
                i == res.length - 1) {
                let dateMeaned = `${prevItemDate.getMonth()+1}/${prevItemDate.getDate()}/${prevItemDate.getFullYear()} ${prevItemDate.getHours()}:${prevItemDate.getMinutes()}:00`;
                return {
                    fkMetrica: item.fkMetrica,
                    valorLeitura: parseFloat(res[i - 1].valorLeitura),
                    dataColeta: dateMeaned,
                }
            }
        }

    });
    let inicio = new Date();
    console.log("Etapa 1 Terminada: " + `${inicio.getHours()}:${inicio.getMinutes()}:${inicio.getSeconds()}`)

    res = res.filter((item) => { return item !== undefined });
    return res;
}

function getMathInformationsEnhanced(data) {
    return {
        mean: math.round(math.mean(data), 3),
        /* variance: math.round(math.variance(data, "uncorrected"), 3), */
        standardDeviation: math.round(math.std(data), 3),
        min: math.round(math.min(data), 3),
        max: math.round(math.max(data), 3),
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