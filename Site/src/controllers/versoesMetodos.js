
/* 
   Tempo antigo: ~11s 
   Tempo Novo: ~6.84s
   Diferença de ~38% na velocidade para cada dia
*/
/* Método antigo */
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
/* Método SQL V2 */
async function getMeanHours(req, res) {
    
    let inicio = new Date();
    console.log("Inicio: " + `${inicio.getHours()}:${inicio.getMinutes()}:${inicio.getSeconds()}`);
    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;
    
    let allPromises = [];
    let metricas = await dashModel.getMetricas();
    let dataTime = await dashModel.getDataTime(fkEmpresa, fkMaquina);

    let response = {};

    for (let i = 0; i < dataTime.length; i++) {
        let date = new Date(dataTime[i].onlyDay);
        date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        response[`${date}`] = {};
        response[`${date}`][`${dataTime[i].onlyHour}`] = {};

        let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, date, dataTime[i].onlyHour, metricas);
        
        allPromises.push(dateMetrica);
    }

    Promise.all(allPromises).then((values) => {
        values.forEach((result) => {
            response[`${result.date}`][`${result.hour}`] = result.result;
        });
        let fim = new Date();
        console.log("Fim: " + `${fim.getHours()}:${fim.getMinutes()}:${fim.getSeconds()}`);
        console.log("Tempo: " + (fim.getTime() - inicio.getTime()) / 1000 + "s");
        res.json(response);
    });
}
/* Método SQL V3 - Errei uma coisa */
async function getMeanHours(req, res) {
    let inicio = new Date();
    console.log("Inicio: " + `${inicio.getHours()}:${inicio.getMinutes()}:${inicio.getSeconds()}`);
    let fkMaquina = req.params.fkMaquina;
    let fkEmpresa = req.params.fkEmpresa;

    let allPromises = [];

    Promise.all([dashModel.getMetricas(), dashModel.getDataTime(fkEmpresa, fkMaquina)]).then((values) => {
        let metricas, dataTime;
        [metricas, dataTime] = values;

        let response = {};

        for (let i = 0; i < 1; i++) {
            let date = new Date(dataTime[i].onlyDay);
            date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            response[`${date}`] = {};
            response[`${date}`][`${dataTime[i].onlyHour}`] = {};

            let dateMetrica = dashModel.getMetricaInfoByDateHour(fkEmpresa, fkMaquina, date, dataTime[i].onlyHour, metricas);

            allPromises.push(dateMetrica);
        }

        Promise.all(allPromises).then((values) => {
            values.forEach((result) => {
                response[`${result.date}`][`${result.hour}`] = result.result;
            });
            let fim = new Date();
            console.log("Fim: " + `${fim.getHours()}:${fim.getMinutes()}:${fim.getSeconds()}`);
            console.log("Tempo: " + (fim.getTime() - inicio.getTime()) / 1000 + "s");
            res.json(response);
        });
    });
}