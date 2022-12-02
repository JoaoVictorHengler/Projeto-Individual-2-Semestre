const labels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
];

var alert, allLabels = [], allData;

const labelsTranslate = {
    "cpu_Utilizacao": "Média da Utilização Da CPU",
    "cpu_Temperature": "Média da Temperatura Da CPU",
    "ram_Usada": "Média da Utilização Da Memória Ram",
    "disco_Usado": "Média da Utilização Do Disco",
    "disco_read_time": "Leitura Do Disco",
    "disco_write_time": "Escrita Do Disco",
    "cpu_Frequencia_Atual": "Frequência Da CPU",
}

/* 
    ---------------------------------------------------------------------------------
                            Carrega o gráfico com as médias e os dias
    ---------------------------------------------------------------------------------
*/


/* Faz as requisi;óes dos dados do gráfico */
async function getDates() {
    let res = await fetch("/npd/getInformationsByDateHour/1&1", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });
    res = await res.json();
    allData = res.response;
    console.log(res);

    appendLabels(res.response);
    loadMachineInfo(res.nomeMaquina, res.hashMaquina);
    alert.close()
}

function loadMachineInfo(machineName, machineHash) {
    /* Atualizar o nome da maquina e a hash */
    document.getElementById('server-name').innerHTML = machineName;

    let macAddress = '';
    machineHash = machineHash.split("");
    for (let i = 2; i < machineHash.length; i += 2) {
        if (i % 2 == 0) {
            if (i == machineHash.length - 2) macAddress += machineHash[i - 1] + machineHash[i];
            else macAddress += machineHash[i - 1] + machineHash[i] + ":";

        }
    }

    document.getElementById('server-num').innerHTML = macAddress;
}

/* Adiciona as labels no gráfico */
function appendLabels(data) {
    let label;

    for (let date in data) {
        for (let hour in data[date]) {
            label = `${date}-${hour}h`;
            if (chartAllDataMean.data.labels.indexOf(label) == -1) {
                chartAllDataMean.data.labels.push(label);
                allLabels.push(label);

            }
        }
    }
    chartAllDataMean.update();
    console.log("Labels adicionadas.");
    separateChartData(data)
}

/* Separa os dados, para que possa adicionar no gráfico */
function separateChartData(data) {
    for (let date in data) {
        for (let hour in data[date]) {
            for (let metric in data[date][hour]) {
                if (metric == "cpu_Frequencia_Atual" || metric == "disco_read_time" || metric == "disco_write_time") continue;
                let datasetPosArr = findDataset(labelsTranslate[metric]);
                let chartAllDataMeanLabelPos = chartAllDataMean.data.labels.indexOf(`${date}-${hour}h`);

                if (chartAllDataMean.data.datasets[datasetPosArr].data[chartAllDataMeanLabelPos] === undefined) {
                    for (let i = chartAllDataMean.data.datasets[datasetPosArr].data.length; i < chartAllDataMeanLabelPos; i++) {
                        chartAllDataMean.data.datasets[datasetPosArr].data.push(null);
                    }
                }

                if (data[date][hour][metric].math == undefined) appendChartData(null, metric);
                else appendChartData(data[date][hour][metric].math.mean, metric);
            }
        }
    }
    console.log("Dados Adicionados.");
    chartAllDataMean.update();
    appendSelectDates();
}

/* Procura o dataset através de sua label */
function findDataset(label) {
    for (let i = 0; i < chartAllDataMean.data.datasets.length; i++) {
        if (chartAllDataMean.data.datasets[i].label == label) {
            return i;
        }
    }
}

/* Adiciona um valor em algum dataset */
function appendChartData(value, metrica) {
    let dataset_num = findDataset(labelsTranslate[metrica]);
    chartAllDataMean.data.datasets[dataset_num].data.push(value);
}

/* Adiciona as datas e horas disponíveis no gráfico para poder verificar a sua media, variancia e desvio padrão */
function appendSelectDates() {
    allLabels.forEach((label) => {
        let option = document.createElement("option");
        option.value = label;
        option.innerHTML = label;
        document.getElementById("labels").appendChild(option);
    });
}


/* 
    ---------------------------------------------------------------------------------
                            Atualizar Select do HTML
    ---------------------------------------------------------------------------------
*/

/* Faz a manipulação da tabela e da hora para adicionar os gráficos na tablea */
function updateSelect() {   
    let table = document.getElementById("table-metric");
    table.innerHTML = ``;
    
    let label = document.getElementById("labels").value;
    document.getElementById("chart-specific-metric").style.opacity = "";
    clearChart();
    if (label == "0") {
        return;
    }
    
    let date = label.split("-")[0];
    let hour = label.split("-")[1].split("h")[0];
    
    Object.keys(allData[date][hour]).forEach(
        (metric) => {
            let metricValue = allData[date][hour][metric];
            loadTable(metric, date, hour, metricValue.math.mean, metricValue.math.standardDeviation, metricValue.math.min, metricValue.math.max);
        });


}

/* Gera um elemento tr para adicionar uma nova linha na tabela */
function loadTable(metricName, date, hour, mean, std, min, max) {
    let table = document.getElementById("table-metric");

    let tr = document.createElement("tr");

    tr.innerHTML = `
                <td scope="row">${labelsTranslate[metricName]}</td>
                <td>${mean.toFixed(1)}</td>
                <td>${std.toFixed(1)}</td>
                <td>${min.toFixed(1)}</td>
                <td>${max.toFixed(1)}</td>`;
    tr.onclick = () => {
        selectMetric(metricName, date, hour);
    }
    tr.style.cursor = "pointer";
    table.appendChild(tr);
}


/* 
    ---------------------------------------------------------------------------------
                Cria o predict através da média entre os pontos do gráfico
    ---------------------------------------------------------------------------------
*/

/* Faz toda a parte inicial para poder criar um predict de um dataset */
async function createPredict() {
    for (let i = 0; i < 5; i++) {
        let nextDate = createNextDate();
        chartAllDataMean.data.labels.push(nextDate);
    }
    let allPromises = [];
    for (let dataset in chartAllDataMean.data.datasets) {
        allPromises.push(createPredictUsingDataset(dataset, chartAllDataMean.data.datasets[dataset]));
    }
    let values = await Promise.all(allPromises);
    
    removeLastDatasetData();

    chartAllDataMean.update();
    console.log("Previsão criada.");
}

/* Através do primeiro gráfico, irá criar uma nova data para adicionar na label*/
function createNextDate() {
    let lastDateChart = chartAllDataMean.data.labels[chartAllDataMean.data.labels.length - 1];
    let lastDateSplited = lastDateChart.split("-");
    let lastDay = lastDateSplited[0];

    if (lastDay.length == 9) lastDay = "0" + lastDay;
    lastDay = `${lastDay.substring(6, 10)}/${lastDay.substring(3, 5)}/${lastDay.substring(0, 2)}`;
    let lastHour = lastDateSplited[1].split("h")[0];

    let date = lastDay + " " + lastHour + ":00:00";
    let newDate = new Date(date);
    newDate.setHours(newDate.getHours() + 1);

    newDate = `${newDate.getDate()}/${newDate.getMonth() + 1}/${newDate.getFullYear()}-${newDate.getHours()}h`;
    return newDate;
}

/* Faz a manipulação dos dados para obter a média do ângulo dos pontos*/
function createPredictUsingDataset(datasetPosArr, dataset) {
    return new Promise((resolve, reject) => {
        if (dataset.data.length > 0) {
            for (let i = 0; i < 5; i++) {
                let graph = [];
                let lengthDataset = dataset.data.length;
                let medianDataset = Math.floor(lengthDataset / 2);

                for (let j = lengthDataset; j > medianDataset + i; j--) {
                    if (dataset.data[j] != null && dataset.data[j - 1] != null) {
                        graph.push([dataset.data[j - 1], dataset.data[j]]);
                    }
                }

                let meanAngle = getMeanGraphAngle(graph);
                let predict = (meanAngle * ((lengthDataset + 1) - lengthDataset)) + dataset.data[lengthDataset - 1];

                chartAllDataMean.data.datasets[datasetPosArr].data.push(predict);
            }
        }
        resolve("Finalizado");
        /* reject("Erro"); */
    });
}

/* Pega a média dos angulos entre cada ponto do gráfico */
function getMeanGraphAngle(data) {
    let graphAngles = [];

    data.forEach((value, i, arr) => {
        if (i > 0) {
            let x1 = i - 1;
            let y1 = value[0];
            let x2 = i;
            let y2 = value[1];

            let a = (y2 - y1) / (x2 - x1);

            graphAngles.push(a);
        }
    });
    let totalAngle = 0;
    graphAngles.forEach(
        (value) => {
            totalAngle += value;
        }
    )
    totalAngle /= graphAngles.length;
    /* console.log("Angulo médio do gráfico: " + totalAngle); */
    return totalAngle;
}

/* Remove o primeiro valor dos dados do gráfico */
function removeLastDatasetData() {
    for (let i = 0; i < 3; i++) {
        chartAllDataMean.data.labels.shift();
    }
    for (let dataset in chartAllDataMean.data.datasets) {
        for (let i = 0; i < 3; i++) {
            chartAllDataMean.data.datasets[dataset].data.shift();
        }
    }
}

function predict2() {
    var worker = new Worker('./worker.js');
    worker.onmessage = function (msg) {
        this.postMessage(msg.data);
    };
    worker.postMessage({ data: 10 });
}

/* 
    ---------------------------------------------------------------------------------
                                        Inicio
    ---------------------------------------------------------------------------------
*/
function main() {
    alert = swal.fire({
        title: "Carregando...",
        didOpen: () => {
            Swal.showLoading()
            getDates();
        }
    });
}

main();


/* 
    ---------------------------------------------------------------------------------
                            Selecionar Métrica na tabela  
    ---------------------------------------------------------------------------------
*/

/* Altera a opacidade do gráfico, manipula o dia para funcionar os dados e adiciona os dados no outro gráfico*/
function selectMetric(metric, date, hour) {
    clearChart();
    let chart = document.getElementById('chart-specific-metric');
    if (chart.style.opacity == '') chart.style.opacity = '1';

    let metricElement = allData[date][hour][metric];
    let metricData = metricElement.allDataHour;
    console.log(metricElement)
    Object.keys(metricData).reverse().forEach(
        (minuteData) => {

            chartSpecificData.data.labels.push(minuteData);
            chartSpecificData.data.datasets[0].data.push(metricData[minuteData]);
            chartSpecificData.data.datasets[1].data.push(parseFloat((metricElement.math.mean - metricElement.math.standardDeviation).toFixed(1)));
            chartSpecificData.data.datasets[2].data.push(parseFloat((metricElement.math.mean + metricElement.math.standardDeviation).toFixed(1)));
        }
    )

    chartSpecificData.update();
}

/* Limpa o gráfico para outra métrica ser inserida */
function clearChart() {
    chartSpecificData.data.datasets.forEach((dataset) => {
        dataset.data = [];
    });
    chartSpecificData.data.labels = [];
    chartSpecificData.update();
}


/* 
    ---------------------------------------------------------------------------------
            Criar predict através de uma machine learning de modelo linear
    ---------------------------------------------------------------------------------
*/


/* Inicia a requisição dos dados, junto com o SweetAlert */
function startPredictWithMl() {
    alert = swal.fire({
        title: "Carregando...",
        didOpen: async () => {
            Swal.showLoading()
            createPredictWithMl();
        }
    })
}

/* Faz a requisição e adiciona os valores no gráfico */
async function createPredictWithMl() {
    let res = await fetch(`http://localhost:3000/npd/predictWithMl/${1}&${1}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
            });
    let json = await res.json();
    alert.close();
    console.log(json);

    for (let i = 0; i < 5; i++) {
        let nextDate = createNextDate();
        chartAllDataMean.data.labels.push(nextDate);
    }

    appendPredictWithMlData(json);

    removeLastDatasetData(); 
    chartAllDataMean.update();
}

function appendPredictWithMlData(json) {
    for (let metrica in json) {
        let dataset = chartAllDataMean.data.datasets.filter(x => {return x.label == labelsTranslate[metrica]});

        if (dataset.length > 0) {
            for (let data in json[metrica]) {
                dataset[0].data.push(json[metrica][data]);
            }
        }
    }
}

/* var mySlider = new rSlider({
    target: '#sampleSlider',
    values: [2008, 2009, 2010, 2011],
    range: true // range slider
}); */

