import numpy, pandas, json
from datetime import datetime

def get_mean(data):
  mean = 0
  for i in range(len(data)):
    mean += data[i]
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
  date = [int(x) for x in date] 

  return datetime(date[0], date[1], date[2], date[3], date[4], date[5])

def get_dataset():
  dataset = pandas.read_csv("./Utilizacao_Cpu.csv", sep=";")
  return dataset.to_dict("records")

def get_hours_mean(data, i):
  item_date = get_date(data[i]["dataColeta"])

  if i >= 1:
    last_item_date = get_date(data[i - 1]["dataColeta"])

    if item_date.hour != last_item_date.hour or item_date.minute != last_item_date.minute:
        return list(filter(lambda x: ((get_date(x["dataColeta"]).hour == item_date.hour and get_date(x["dataColeta"]).minute == item_date.minute)), data))

def get_value(data):
  all_values = []
  for i in range(len(data)):
    all_values.append(data[i]["valorLeitura"])  
  return get_mean(all_values)
  

data = get_dataset()
all_data_finished = {}
for i in range(len(data)):
  item = data[i]

  item_filtered_mean = get_hours_mean(data, i)
  
  if (item_filtered_mean != None):
      mean = get_value(item_filtered_mean)
      date = get_date(item["dataColeta"])
      date = date.timestamp()
      # date = 
      all_data_finished[date] = round(mean, 3)
  print("Item: ", i, " de ", len(data))


new_all_data_finished = {}
for i in sorted(all_data_finished.keys()):
  date = datetime.fromtimestamp(int(i))
  new_all_data_finished[date.strftime("%d/%m/%Y %H:%M:%S")] = all_data_finished[i]

with open("result.json", "w") as file:
  file.write(json.dumps(new_all_data_finished))

""" hour = str(item_date.hour)
  if len(str(item_date.hour)) == 1:
    hour = "0" + str(item_date.hour)

  minute = str(item_date.minute)
  if len(str(item_date.minute)) == 1:
    minute = "0" + str(item_date.minute)

  newData.append({
                "nomeMaquina": item["nomeMaquina"],
                "nomeComponente": item["nomeComponente"],
                "nomeMetrica": item["nomeMetrica"],
                "unidadeDeMedida": item["unidadeDeMedida"],
                "dataColeta": str(item_date.year) + "-" + str(item_date.month + 1) + "-" + str(item_date.day),
                "horaColeta": hour + ":" + minute + ":00",
                "valorLeitura": data[i]["valorLeitura"]
            }) """

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