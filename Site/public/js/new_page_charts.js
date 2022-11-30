var chartAllDataMean = new Chart(
    document.getElementById('chart'),
    {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                spanGaps: false,
                label: 'Utilização Da CPU',
                borderColor: '#042940',
                fill: false,
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
                borderColor: '#005C53',
                fill: false,
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
                borderColor: '#9FC131',
                fill: false,
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
                borderColor: '#DBF227',
                fill: false,
                data: [],
                lineTension: 0.3,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
                borderRadius: 0.1
            },]
        },
        options: {
            scales: {
                y: {
                    ticks: {
                        stepSize: 50
                    }
                }
            },
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    }
);

var chartSpecificData = new Chart(
    document.getElementById('chart2'),
    {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                spanGaps: false,
                label: 'Média',
                borderColor: '#042940',
                fill: false,
                data: [],
                lineTension: 0.3,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
                borderRadius: 0.1
            }, {
                spanGaps: false,
                label: 'Desvio Padrão',
                borderColor: '#005C53',
                fill: false,
                data: [],
                lineTension: 0.3,
                pointRadius: 2,
                pointHitRadius: 100,
                pointBorderWidth: 2,
                borderRadius: 0.1
            }
            ],
        },
        options: {
            scales: {
                y: {
                    ticks: {
                        stepSize: 50
                    }
                }
            },
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });