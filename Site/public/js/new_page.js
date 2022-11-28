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


var myChart = new Chart(
    document.getElementById('chart'),
    {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                spanGaps: false,
                label: 'Utilização Da CPU',
                backgroundColor: 'rgba(1, 46, 64, 0.50)',
                borderColor: 'rgba(1, 46, 64, 0.80)',
                fill: true,
                data: [],

                lineTension: 0.3,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
                borderRadius: 0.1

            },
            {
                spanGaps: false,
                label: 'Temperatura Da CPU',
                backgroundColor: 'rgba(34, 187, 187, 0.50)',
                borderColor: '#22BABB',
                fill: true,
                data: [],
                lineTension: 0.3,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
                borderRadius: 0.1
            },
            {
                spanGaps: false,
                label: 'Utilização Da Memória Ram',
                backgroundColor: 'rgba(52, 136, 136, 0.50)',
                borderColor: '#348888',
                fill: true,
                data: [],
                lineTension: 0.3,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
                borderRadius: 0.1
            },
            {
                spanGaps: false,
                label: 'Utilização Do Disco',
                backgroundColor: 'rgba(158, 248, 238, 0.50)', // Alerta: #FA7F08 Crítico: #F24405
                borderColor: '#9EF8EE',
                fill: true,
                data: [],
                lineTension: 0.3,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
                borderRadius: 0.1
            },]
        },
        options: {
        }
    }
);


function updateTable() {

}

async function getDates() {
    let res = await fetch("/npd/getInformationsByDateHour/2&1", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
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
    for (let i = 0; i < myChart.data.datasets.length; i++) {
        if (myChart.data.datasets[i].label == label) {
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
            if (myChart.data.labels.indexOf(label) == -1) {
                myChart.data.labels.push(label);
                allLabels.push(label);

            }
        }
    }
    myChart.update();
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
                let myChartLabelPos = myChart.data.labels.indexOf(`${date2}-${hour}h`);

                if (myChart.data.datasets[datasetPosArr].data[myChartLabelPos] === undefined) {
                    for (let i = myChart.data.datasets[datasetPosArr].data.length; i < myChartLabelPos; i++) {
                        myChart.data.datasets[datasetPosArr].data.push(null);
                    }
                }


                if (data[date][hour][metric].math == undefined) appendChartData(null, metric);
                else appendChartData(data[date][hour][metric].math.mean, metric);
            }
        }
    }
    console.log("Dados Adicionados.");
    myChart.update();
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
    table.innerHTML = `
        <tr>
            <th>Métrica</th>
            <th>Dia</th>
            <th>Média</th>
            <th>Variação</th>
            <th>Desvio</th>
            <th>Mínimo</th>
            <th>Máximo</th>
        </tr>`;
    
    let label = document.getElementById("labels").value;
    if (label == "0") return;

    let date = label.split("-")[0];
    date = date.split("/");
    date = date[2] + "-" + date[1] + "-" + date[0];
    let hour = label.split("-")[1].split("h")[0];
    
    Object.keys(allData[date][hour]).forEach((metric) => {
        let metricValue = allData[date][hour][metric];
        console.log(metricValue);
        loadTable(metric, label, metricValue.math.mean, metricValue.math.variance, 
            metricValue.math.standardDeviation);
    });



}

function loadTable(metricName, date, mean, variance, std) {
    let table = document.getElementById("table-metric");

    let tr = document.createElement("tr");

    tr.innerHTML = `
                <td>${labelsTranslate[metricName]}</td>
                <td>${date}</td>
                <td>${mean.toFixed(1)}</td>
                <td>${variance.toFixed(1)}</td>
                <td>${std.toFixed(1)}</td>
                <td>min</td>
                <td>max</td>`;
    table.appendChild(tr);





}

function appendChartData(value, metrica) {
    let dataset_num = findDataset(labelsTranslate[metrica]);
    myChart.data.datasets[dataset_num].data.push(value);
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
    let lastDateChart = myChart.data.labels[myChart.data.labels.length - 1];
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
        myChart.data.labels.push(nextDate);
    }
    let allPromises = [];
    for (let dataset in myChart.data.datasets) {
        allPromises.push(createPredictUsingDataset(dataset, myChart.data.datasets[dataset]));
    }
    Promise.all(allPromises).then(
        (values) => {
            for (let i = 0; i < 3; i++) {
                myChart.data.labels.shift();
            }
            for (let dataset in myChart.data.datasets) {
                for (let i = 0; i < 3; i++) {
                    myChart.data.datasets[dataset].data.shift();
                }
            }

            myChart.update();
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

                myChart.data.datasets[datasetPosArr].data.push(predict);

                let chartBorderColor = [];
                for (let i = 0; i < dataset.data.length - 1; i++) {
                    chartBorderColor.push(dataset.borderColor);
                }
                chartBorderColor.push("#FA7F08");

                myChart.data.datasets[datasetPosArr].pointBackgroundColor = chartBorderColor;
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
/* var mySlider = new rSlider({
    target: '#sampleSlider',
    values: [2008, 2009, 2010, 2011],
    range: true // range slider
}); */

/* Datepicker */
/* for (let i = 0; i < datepickers.length; i++) {
        let date = datesSorted[datesSorted.length - 1];

        if (datepickers[i] == "#datepicker1") date = datesSorted[0];

        $(datepickers[i]).datepicker({
            multidate: false,
            format: 'dd/mm/yyyy',
            language: "pt-BR",
            beforeShowDay: (date) => {
                let dmy = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
                if (datesSorted.indexOf(dmy) != -1) return true;
                else return false;
            }
        })
        $(datepickers[i]).datepicker("setDate", date);
    } */