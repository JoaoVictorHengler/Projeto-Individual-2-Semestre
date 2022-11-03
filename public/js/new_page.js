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

const myChart = new Chart(
    document.getElementById('myChart'),
    {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Utilização Da CPU',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [],
            },
            {
                label: 'Temperatura Da CPU',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [],
            },
            {
                label: 'Utilização Da Memória Ram',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [],
            },
            {
                label: 'Utilização Do Disco',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: [],
            },]
        },
        options: {}
    }
);

function setDataPicker(dates) {
    let datepickers = ["#datepicker1", "#datepicker2"];

    for (let i = 0; i < datepickers.length; i++) {

        if (datepickers[i] == "#datepicker1") $(datepickers[i]).datepicker('update', dates[0]);
        else $(datepickers[i]).datepicker('update', dates[dates.length - 1]);

        $(datepickers[i]).datepicker({
            multidate: true,
            format: 'dd/mm/yyyy',
            language: "pt-BR",
            beforeShowDay: (date) => {
                let dmy = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
                if (dates.indexOf(dmy) != -1) return true;
                else return false;
            }
        })
    }
}

async function getDates() {
    let res = await fetch("/npd/getDataByDate/1&1", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    res = await res.json();
    let keys = Object.keys(res);
    
    teste.innerHTML += "OK"
    console.log(res)
    setDataPicker(keys)
    appendChartData(res)
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

function appendChartData(data) {
    let keys = Object.keys(data);
    let metricas, value;
    
    for (let i = 0; i < keys.length; i++) {
        metricas = data[keys[i]];
        myChart.data.labels.push(keys[i])
        
        for (let metrica in metricas) {
            value = metricas[metrica].mean;

            findDataset(labelsTranslate[metrica], value)
        }
        myChart.update()
    }
    
}

getDates()
/* var mySlider = new rSlider({
    target: '#sampleSlider',
    values: [2008, 2009, 2010, 2011],
    range: true // range slider
}); */