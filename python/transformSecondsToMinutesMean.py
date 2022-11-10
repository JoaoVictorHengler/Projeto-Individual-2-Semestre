import numpy, pandas, json
from datetime import datetime

file_name = "Ram_Usada"


""" Pegar a média de cada Minuto """

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
  dataset = pandas.read_csv("./" + file_name + ".csv", sep=";")
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

""" Pegar a média de cada Hora """

def get_mean_hour_type(data, keys):
    mean = 0
    for key in keys:
        mean += data[key]
    mean /= len(data)
    return mean


def get_date_hour_type(date):
    date = f"{date[6:10]}-{date[3:5]}-{date[0:2]} {date[11:13]}:{date[14:16]}:{date[17:19]}"
    date = date.split("-")
    hourWithDate = date[-1]
    date.pop()
    date = date + hourWithDate.split(" ")
    hour = date[-1]
    date.pop()
    date = date + hour.split(":")
    date = [int(x) for x in date]

    return datetime(date[0], date[1], date[2], date[3], date[4], date[5])

def try_to_find_key(data, key):
    try:
        data[key]
        return True
    except:
        return False

def transform_minute_to_hour(data):
    result = {}
    data_list = list(data.keys())
    for i in range(len(data_list)):
        item_name = data_list[i]
        
        item_date = get_date_hour_type(item_name)

        if i >= 1:
            last_item_date = get_date_hour_type(data_list[i - 1])
            
            if item_date.hour != last_item_date.hour or (item_date.year == last_item_date.year and (item_date.month == last_item_date.month and item_date.day != last_item_date.day)):

                if not try_to_find_key(result, f"{item_date.day}/{item_date.month}/{item_date.year}"):
                    result[f"{item_date.day}/{item_date.month}/{item_date.year}"] = {}

                hour_data = list(filter(lambda x: ((get_date_hour_type(x).hour == last_item_date.hour and get_date_hour_type(x).day == last_item_date.day and get_date_hour_type(x).month == last_item_date.month and get_date_hour_type(x).year == last_item_date.year)), data))
                
                hour_data = round(get_mean_hour_type(data, hour_data), 3)
                result[f"{last_item_date.day}/{last_item_date.month}/{last_item_date.year}"][f"{last_item_date.hour}"] = hour_data

    return result


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

result = transform_minute_to_hour(new_all_data_finished)
print(result)

with open("final_result" + file_name + ".json", "w") as file:
  file.write(json.dumps(result))
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