const labels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
];

const data = {
    labels: labels,
    datasets: [{
        label: 'My First dataset',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [0, 10, 5, 2, 20, 30, 45],
    }]
};

const config = {
    type: 'line',
    data: data,
    options: {}
};

const myChart = new Chart(
    document.getElementById('myChart'),
    config
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
    let keys = Object.keys(await res.json());
    keys = keys.reverse()
    teste.innerHTML += "OK"
    setDataPicker(keys)
}

getDates()
/* var mySlider = new rSlider({
    target: '#sampleSlider',
    values: [2008, 2009, 2010, 2011],
    range: true // range slider
}); */