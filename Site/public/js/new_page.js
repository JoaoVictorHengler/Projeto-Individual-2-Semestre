const labels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
];

var alert;

const labelsTranslate = {
    "cpu_Utilizacao": "Utilização Da CPU",
    "cpu_Temperature": "Temperatura Da CPU",
    "ram_Usada": "Utilização Da Memória Ram",
    "disco_Usado": "Utilização Do Disco",
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

                lineTension: 0.1,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,

            },
            {
                spanGaps: false,
                label: 'Temperatura Da CPU',
                backgroundColor: 'rgba(34, 187, 187, 0.50)',
                borderColor: '#22BABB',
                fill: true,
                data: [],
                lineTension: 0.1,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
            },
            {
                spanGaps: false,
                label: 'Utilização Da Memória Ram',
                backgroundColor: 'rgba(52, 136, 136, 0.50)',
                borderColor: '#348888',
                fill: true,
                data: [],
                lineTension: 0.1,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
            },
            {
                spanGaps: false,
                label: 'Utilização Do Disco',
                backgroundColor: 'rgba(158, 248, 238, 0.50)', // Alerta: #FA7F08 Crítico: #F24405
                borderColor: '#9EF8EE',
                fill: true,
                data: [],
                lineTension: 0.1,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
            },]
        },
        options: {
        }
    }
);

async function getDates() {
    let res = await fetch("/npd/getInformationsByDateHour/1&1", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    res = await res.json();

    console.log(res);
    res = organizeDate(res);
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
        for (let hour in data[date]) {
            label = `${date}-${hour}h`;
            if (myChart.data.labels.indexOf(label) == -1) {
                myChart.data.labels.push(label);
            }
        }
    }
    myChart.update();
    console.log("Labels adicionadas.");
    separateChartData(data)
}

function separateChartData(data) {
    for (let date in data) {
        for (let hour in data[date]) {
            for (let metric in data[date][hour]) {
                let datasetPosArr = findDataset(labelsTranslate[metric]);
                let myChartLabelPos = myChart.data.labels.indexOf(`${date}-${hour}h`);
                if (myChart.data.datasets[datasetPosArr].data[myChartLabelPos] == undefined) {
                    for (let i = myChart.data.datasets[datasetPosArr].data.length; i < myChartLabelPos; i++) {
                        myChart.data.datasets[datasetPosArr].data.push(null);
                    }
                }
                appendChartData(data[date][hour][metric].mean, metric)
            }
        }
    }
}

function appendChartData(value, metrica) {
    let dataset_num = findDataset(labelsTranslate[metrica]);
    myChart.data.datasets[dataset_num].data.push(value);
    myChart.update()
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
                myChart.update();

                let chartBorderColor = [];
                for (let i = 0; i < dataset.data.length - 1; i++) {
                    chartBorderColor.push(dataset.borderColor);
                }
                console.log(chartBorderColor);
                chartBorderColor.push("#FA7F08");
                console.log(chartBorderColor);

                myChart.data.datasets[datasetPosArr].pointBackgroundColor = chartBorderColor;
/*                 myChart.data.datasets[datasetPosArr].borderColor = chartBorderColor; */
/*                 myChart.data.datasets[datasetPosArr].backgroundColor = chartBorderColor; */
                /* myChart.data.datasets[datasetPosArr].backgroundColor = chartBorderColor; */
                myChart.update();
            }
        }
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