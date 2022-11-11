const labels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
];

var labelsTranslate = {
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
                spanGaps: true,
                label: 'Utilização Da CPU',
                backgroundColor: 'rgba(1, 46, 64, 0.50)',
                borderColor: 'rgba(1, 46, 64, 0.80)',
                fill: true,
                data: [],

                lineTension: 0.1,
                pointRadius: 0.1,
                pointHitRadius: 100,
                pointBorderWidth: 0.1,

            },
            {
                spanGaps: true,
                label: 'Temperatura Da CPU',
                backgroundColor: 'rgba(34, 187, 187, 0.50)',
                borderColor: '#22BABB',
                fill: true,
                data: [],
                lineTension: 0.1,
                pointRadius: 0.1,
                pointHitRadius: 100,
                pointBorderWidth: 0.1,
            },
            {
                spanGaps: true,
                label: 'Utilização Da Memória Ram',
                backgroundColor: 'rgba(52, 136, 136, 0.50)',
                borderColor: '#348888',
                fill: true,
                data: [],
                lineTension: 0.1,
                pointRadius: 0.1,
                pointHitRadius: 100,
                pointBorderWidth: 0.1,
            },
            {
                spanGaps: true,
                label: 'Utilização Do Disco',
                backgroundColor: 'rgba(158, 248, 238, 0.50)', // Alerta: #FA7F08 Crítico: #F24405
                borderColor: '#9EF8EE',
                fill: true,
                data: [],
                lineTension: 0.1,
                pointRadius: 0.1,
                pointHitRadius: 100,
                pointBorderWidth: 0.1,
            },]
        },
        options: {
        }
    }
);

function appendLabels(data) {
    for (let metrica in data) {
        for (let day in data[metrica]) {
            new_day = `${day.split("/")[1]}/${day.split("/")[0]}/${day.split("/")[2]}`;
            for (let hour in data[metrica][day]) {
                if (myChart.data.labels.indexOf(`${new_day}-${hour}h`) == -1) {
                    myChart.data.labels.push(`${new_day}-${hour}h`);
                }

            }
        }
    }
    separateChartData(data)
}

function separateChartData(data) {
    for (let metrica in data) {
        for (let day in data[metrica]) {
            new_day = `${day.split("/")[1]}/${day.split("/")[0]}/${day.split("/")[2]}`;
            for (let hour in data[metrica][day]) {
                let dataset_num = findDataset(labelsTranslate[metrica]);
                let myChartLabelPos = myChart.data.labels.indexOf(`${new_day}-${hour}h`);

                if (myChart.data.datasets[dataset_num].data[myChartLabelPos] == undefined) {
                    for (let i = myChart.data.datasets[dataset_num].data.length; i < myChartLabelPos; i++) {
                        myChart.data.datasets[dataset_num].data.push(null);
                    }

                    
                    myChart.data.datasets[dataset_num].data[myChartLabelPos] = data[metrica][day][hour].math.mean;
                }
                console.log(data[metrica][day][hour])
                appendChartData(data[metrica][day][hour], metrica)
            }
        }
    }
}


async function getDates() {
    let res = await fetch("/npd/getInformationsByDateHour/1&1", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    res = await res.json();
    let keys = Object.keys(res);

    
    console.log(res)
    appendLabels(res, keys)

}

function findDataset(label) {
    for (let i = 0; i < myChart.data.datasets.length; i++) {
        if (myChart.data.datasets[i].label == label) {
            return i;
        }
    }
}

function updateKey(data) {
    for (let key in data) {
        let newData = data[key];
        let date = `${key.split("/")[1]}/${key.split("/")[0]}/${key.split("/")[2]}`;
        data[date] = newData;
        delete data[key];
    }
    return data;
}

function appendChartData(value, metrica) {
    let dataset_num = findDataset(labelsTranslate[metrica]);
    myChart.data.datasets[dataset_num].data.push(value.math.mean);
    myChart.update()
}

function createPredict(keys, data, metrica, i) {

    lastKeys = [keys[keys.length - 2], keys[keys.length - 1]]

    let x1, x2, y1, y2;
    x1 = myChart.data.labels.length - 1;
    x2 = myChart.data.labels.length;
    y1 = data[lastKeys[0]][metrica].mean;
    y2 = data[lastKeys[1]][metrica].mean;
    let tanAngle = (y2 - y1) / (x2 - x1);
    console.log("x1: ", x1, "x2: ", x2, "y1: ", y1, "y2: ", y2, "tanAngle: ", tanAngle)

    x1 = myChart.data.labels.length;
    x2 = myChart.data.labels.length + 1;
    y1 = data[lastKeys[1]][metrica].mean;
    let predict = (tanAngle * (x2 - x1)) + y1;
    console.log("x1: ", x1, "x2: ", x2, "y1: ", y1, "predict: ", predict)
    findDataset(labelsTranslate[metrica], predict);

    let newDate = new Date(lastKeys[1]);
    newDate.setDate(newDate.getDate() + 1);
    newDate = `${newDate.getDate()}/${newDate.getMonth() + 1}/${newDate.getFullYear()}`



    keys[newDate] = {};
    keys[newDate][metrica] = {};
    keys[newDate][metrica].mean = predict;
    return keys
}

getDates()
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