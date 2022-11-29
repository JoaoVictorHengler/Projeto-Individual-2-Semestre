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
    "cpu_Utilizacao": "Utilização Da CPU",
    "cpu_Temperature": "Temperatura Da CPU",
    "ram_Usada": "Utilização Da Memória Ram",
    "disco_Usado": "Utilização Do Disco",
    "disco_read_time": "Leitura Do Disco",
    "disco_write_time": "Escrita Do Disco",
    "cpu_Frequencia_Atual": "Frequência Da CPU",
}

async function getDates() {
    let res = await fetch("/npd/getInformationsByDateHour/1&1", {
        
        
    });
    res = await res.json();
    allData = res;
    console.log(res);

    appendLabels(res);
    alert.close()

}

function organizeDate(data) {
    let objectKeysDate = Object.keys(data);
    objectKeysDate = objectKeysDate.reverse();
    let newData = {};
    for (let i = 0; i < objectKeysDate.length; i++) {
        newData[objectKeysDate[i]] = data[objectKeysDate[i]];
    }

    return newData;
}

function findDataset(label) {
    for (let i = 0; i < chartAllDataMean.data.datasets.length; i++) {
        if (chartAllDataMean.data.datasets[i].label == label) {
            return i;
        }
    }
}

function appendLabels(data) {
    let label;

    for (let date in data) {
        let date2 = date.split("-");
        date2 = date2[2] + "/" + date2[1] + "/" + date2[0];
        for (let hour in data[date]) {
            label = `${date2}-${hour}h`;
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

function separateChartData(data) {
    for (let date in data) {
        let date2 = date.split("-");
        date2 = date2[2] + "/" + date2[1] + "/" + date2[0];
        for (let hour in data[date]) {
            for (let metric in data[date][hour]) {
                if (metric == "cpu_Frequencia_Atual" || metric == "disco_read_time" || metric == "disco_write_time") continue;
                let datasetPosArr = findDataset(labelsTranslate[metric]);
                let chartAllDataMeanLabelPos = chartAllDataMean.data.labels.indexOf(`${date2}-${hour}h`);

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

function appendSelectDates() {
    allLabels.forEach((label) => {
        let option = document.createElement("option");
        option.value = label;
        option.innerHTML = label;
        document.getElementById("labels").appendChild(option);
    });
}

function updateSelect() {   
    let table = document.getElementById("table-metric");
    table.innerHTML = ``;
    
    let label = document.getElementById("labels").value;
    if (label == "0") return;

    let date = label.split("-")[0];
    date = date.split("/");
    date = date[2] + "-" + date[1] + "-" + date[0];
    let hour = label.split("-")[1].split("h")[0];
    
    Object.keys(allData[date][hour]).forEach((metric) => {
        let metricValue = allData[date][hour][metric];
        loadTable(metric, label, metricValue.math.mean, metricValue.math.variance, 
            metricValue.math.standardDeviation);
    });



}

function loadTable(metricName, date, mean, variance, std) {
    let table = document.getElementById("table-metric");

    let tr = document.createElement("tr");

    tr.innerHTML = `
                <td scope="row">${labelsTranslate[metricName]}</td>
                <td>${mean.toFixed(1)}</td>
                <td>${variance.toFixed(1)}</td>
                <td>${std.toFixed(1)}</td>
                <td>min</td>
                <td>max</td>`;
    tr.onclick = () => {
        selectMetric(metricName, date);
    }
    tr.style.cursor = "pointer";
    table.appendChild(tr);





}

function appendChartData(value, metrica) {
    let dataset_num = findDataset(labelsTranslate[metrica]);
    chartAllDataMean.data.datasets[dataset_num].data.push(value);
}

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
    console.log("Angulo médio do gráfico: " + totalAngle);
    return totalAngle;
}

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

function createPredict() {
    for (let i = 0; i < 5; i++) {
        let nextDate = createNextDate();
        chartAllDataMean.data.labels.push(nextDate);
    }
    let allPromises = [];
    for (let dataset in chartAllDataMean.data.datasets) {
        allPromises.push(createPredictUsingDataset(dataset, chartAllDataMean.data.datasets[dataset]));
    }
    Promise.all(allPromises).then(
        (values) => {
            for (let i = 0; i < 3; i++) {
                chartAllDataMean.data.labels.shift();
            }
            for (let dataset in chartAllDataMean.data.datasets) {
                for (let i = 0; i < 3; i++) {
                    chartAllDataMean.data.datasets[dataset].data.shift();
                }
            }

            chartAllDataMean.update();
            console.log("Previsão criada.");
        })

}

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

                let chartBorderColor = [];
                for (let i = 0; i < dataset.data.length - 1; i++) {
                    chartBorderColor.push(dataset.borderColor);
                }
                chartBorderColor.push("#FA7F08");

                chartAllDataMean.data.datasets[datasetPosArr].pointBackgroundColor = chartBorderColor;
            }
        }
        resolve("Finalizado");
        /* reject("Erro"); */
    });
}

/*  */
alert = swal.fire({
    title: "Carregando...",
    didOpen: () => {
        Swal.showLoading()
        getDates();
    }
})

/* Selecionar métrica */
/* -------------------------------------------------------------------------- */
function selectMetric(metric, day) {

    day = day.split("-");
    date = day[0].split("/");
    date = `${date[2]}-${date[1]}-${date[0]}`;
    hour = day[1].split("h")[0];

    console.log("Dia: " + date);
    console.log("Hora: " + hour);
    console.log("Métrica: " + metric);
    let metricData = allData[date][hour][metric].data;
    /* chartSpecificData.data.datasets[0].label = metric; */

    for (let i = 0; i < metricData.length; i++) {
        let element = metricData[i];
        let label = element.date.substring(0, element.date.length - 3);

        chartSpecificData.data.labels.push(label);
        chartSpecificData.data.datasets[0].data.push(element.mean);
        chartSpecificData.data.datasets[1].data.push(element.stdError);
    }
    chartSpecificData.update();
}

async function createPredictWithMl() {
    let res = await fetch("http://localhost:5000/npd/predictWithMl", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            fkEmpresa: 1,
            fkMaquina: 1
        })
    });
    let json = await res.json();
    console.log(json)
}
/* var mySlider = new rSlider({
    target: '#sampleSlider',
    values: [2008, 2009, 2010, 2011],
    range: true // range slider
}); */

