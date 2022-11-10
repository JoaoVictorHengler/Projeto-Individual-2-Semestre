import json
from datetime import datetime

num = 1

if num == 0:
    file_name = "resultRamUsada"
elif num == 1:
    file_name = "result" # Cpu_Utilizacao

def get_json_data():
    with open("./" + file_name + ".json", "r") as file:
        return json.load(file)


def get_mean(data, keys):
    
    mean = 0
    for key in keys:
        mean += data[key]
    mean /= len(keys)
    return mean


def get_date(date):
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
        
        item_date = get_date(item_name)

        if i >= 1:
            last_item_date = get_date(data_list[i - 1])
            
            if item_date.hour != last_item_date.hour or (item_date.year == last_item_date.year and (item_date.month == last_item_date.month and item_date.day != last_item_date.day)):
                if not try_to_find_key(result, f"{item_date.day}/{item_date.month}/{item_date.year}"):
                    result[f"{item_date.day}/{item_date.month}/{item_date.year}"] = {}

                hour_data = list(filter(lambda x: ((get_date(x).hour == last_item_date.hour and get_date(x).day == last_item_date.day and get_date(x).month == last_item_date.month and get_date(x).year == last_item_date.year)), data))
                
                hour_data = round(get_mean(data, hour_data), 3)
                result[f"{last_item_date.day}/{last_item_date.month}/{last_item_date.year}"][f"{last_item_date.hour}"] = hour_data

    return result


data = get_json_data()
result = transform_minute_to_hour(data)
print(result)

with open("final_result" + file_name + ".json", "w") as file:
  file.write(json.dumps(result))