import numpy, pandas, statistics
from datetime import datetime

dataset = pandas.read_csv("./Utilizacao_Cpu.csv", sep=";")
dataset

dataset = dataset.to_dict("records")

def get_mean(data):
  mean = 0
  for i in range(len(data)):
    mean += data[i]["valorLeitura"]
  mean /= len(data)
  return mean

def get_date(date):
  date = date.split("-")
  hourWithDate = date[-1]
  date.pop()
  date = date + hourWithDate.split(" ")
  hour = date[-1]
  date.pop()
  date = date + hour.split(":")
  return date

def filter2(data, last_time, atual_time):
  new_data = []
  for i in range(len(data)):
    if (atual_time.hour == last_time.hour and atual_time.minute == last_time.minute):
      new_data.append(data[i])
  return new_data

def filter_minutes_and_hours(last_time, atual_time):
  if (itemDate.hour == lastItemDate.hour and itemDate.minute == lastItemDate.minute):
    return True
  else:
    return False

newData = []
data = dataset

print(data)
for i in range(len(data)):
  date = get_date(data[i]["dataColeta"])
  date = [int(x) for x in date] 
  itemDate = datetime(date[0], date[1], date[2], date[3], date[4], date[5])
  item = data[i]

  if i >= 1:
    date = get_date(data[i - 1]["dataColeta"])
    date = [int(x) for x in date] 

    lastItemDate = datetime(date[0], date[1], date[2], date[3], date[4], date[5])
    if itemDate.hour == lastItemDate.hour and itemDate.minute == lastItemDate.minute:
        continue
  
  item_filtered = filter(filter_minutes_and_hours, )
  print(item_filtered)
  item_filtered_mean = get_mean(item_filtered)

  hour = str(itemDate.hour)
  if len(str(itemDate.hour)) == 1:
    hour = "0" + str(itemDate.hour)

  minute = str(itemDate.minute)
  if len(str(itemDate.minute)) == 1:
    minute = "0" + str(itemDate.minute)

  newData.append({
                "nomeMaquina": item["nomeMaquina"],
                "nomeComponente": item["nomeComponente"],
                "nomeMetrica": item["nomeMetrica"],
                "unidadeDeMedida": item["unidadeDeMedida"],
                "dataColeta": str(itemDate.year) + "-" + str(itemDate.month + 1) + "-" + str(itemDate.day),
                "horaColeta": hour + ":" + minute + ":00",
                "valorLeitura": data[i]["valorLeitura"]
            })

""" x = []
y = []
for i in range(len(newData)):
  if i == len(newData) -1 or i < 1:
    continue
  data = newData[i]
  if int(newData[i - 1]["horaColeta"][0:2]) == int(newData[i]["horaColeta"][0:2]) or int(newData[i - 1]["horaColeta"][3:5]) == int(newData[i]["horaColeta"][3:5]) - 1:
    x.append(newData[i - 1]["valorLeitura"])
    y.append(newData[i]["valorLeitura"])
 """