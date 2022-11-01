var database = require("../database/config")

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

async function getMeanDates(fkEmpresa, fkMaquina, nomeMetrica) {
    let machine = await getMaquinaInfo(fkEmpresa, fkMaquina);
    let data = await getView(machine[0].nomeEmpresa, machine[0].nomeMaquina, nomeMetrica, false, false);
    let date = await separateDate(data);

    let res = {};
    for (let i = 0; i < date.length; i++) {
        let dataDate = getMean(await getSeparatedDate(data, date[i]));
        if (res[date[i]] == undefined) res[date[i]] = {};
        res[date[i]][nomeMetrica] = dataDate;
    }
    return res;
}

async function separateDate(data, type = "date") {
    data = data.map(
        (item) => {
            let date = new Date(item.dataColeta);
            if (type == "date") item.dataColeta = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            else if (type == "time") item.dataColeta = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            else if (type == "month") item.dataColeta = `${date.getMonth() + 1}/${date.getFullYear()}`;

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

function getMean(data) {
    let mean = 0;
    for (let i = 0; i < data.length; i++) {
        mean += parseFloat(data[i].valorLeitura);
    }
    return parseFloat((mean / data.length).toFixed(2));
}

module.exports = {
    getDados,
    getView,
    getMetricas,
    getMeanDates
}