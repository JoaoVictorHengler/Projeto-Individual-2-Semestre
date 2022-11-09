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
        options: {}
    }
);

function transformData(data) {
    let newData = {};
    for (let metrica in data) {
        for (let day in data[metrica]) {
            
        }
    }
        /* let dayKeys = Object.keys(data[metrica]);
        dayKeys = dayKeys.map(
            (date) => {
                date = new Date(date)
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
            }
        );
        
        dayKeys =  Object.keys(data[metrica]).sort((a, b) => {
            a = `${a.split("/")[1]}/${a.split("/")[0]}/${a.split("/")[2]}`;
            b = `${b.split("/")[1]}/${b.split("/")[0]}/${b.split("/")[2]}`;
            return new Date(a) - new Date(b);
        });

        dayKeys = dayKeys.map(
            (date) => {
                date = new Date(date)
                return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
            }
        )

        console.log("Ordenado: ", dayKeys);
        newData[metrica] = {};

        for (let i = 0; i < dayKeys.length; i++) {
            let hourKeys = Object.keys(data[metrica][dayKeys[i]]);

            for (let j = 0; j < hourKeys.length; j++) {
                let date = new Date(dayKeys[i]);
                date = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                newData[metrica]['Dia'+date+'Hora'+hourKeys[j]] = (data[metrica][dayKeys[i]][hourKeys[j]].math.mean);
            }
        
        }

        dayKeys = dayKeys.map(
            (date) => {
                return `${date.split("/")[0]}/${date.split("/")[1]}/${date.split("/")[2]}`;
            }
        )   

        console.log("Sorteado correto: " + dayKeys)
        appendChartData(newData, dayKeys) */
    
    
    

    

    
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

    teste.innerHTML += "OK"
    console.log(res)
    transformData(res, keys)

}

function findDataset(label, value) {
    if (value == -500) value = 0;
    for (let i = 0; i < myChart.data.datasets.length; i++) {
        if (myChart.data.datasets[i].label == label) {
            myChart.data.datasets[i].data.push(parseFloat(value.toFixed(2)))
            myChart.update()
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

function appendChartData(data, keys) {
    let metricas, value;

    data = updateKey(data);

    for (let i = 0; i < keys.length; i++) {
        metricas = data[keys[i]];
        myChart.data.labels.push(keys[i])

        for (let metrica in metricas) {
            value = metricas[metrica].mean;

            findDataset(labelsTranslate[metrica], value)
        }
        myChart.update()
    }

    if (keys.length < 2) return;

    data = updateKey(data);


    for (let i = 0; i < 3; i++) {
        let lastDate = myChart.data.labels[myChart.data.labels.length - 1];
        let newDate = new Date(lastDate);
        newDate.setDate(newDate.getDate() + 1);
        newDate = `${newDate.getDate()}/${newDate.getMonth() + 1}/${newDate.getFullYear()}`;
        myChart.data.labels.push(newDate);
        for (let metrica in metricas) {
            keys = createPredict(keys, data, metrica);
        }
    }

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