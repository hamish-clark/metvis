#!/usr/bin/env python

import os
import sys
import json
import time
import urllib.request

from pymongo import MongoClient
from apscheduler.schedulers.background import BackgroundScheduler

mongodb_path = 'http://localhost:27017/'
localdb_path = 'data/'


ROUTE_IDS = [
        "1", "2", "3", "3a", "7", "12", "12e", "13", "14", "17", "17e", "18", "18e", "19e", "20", "21", "22",
        "23e", "24", "25", "26", "29e", "30x", "31x", "32x", "33", "34", "35", "36", "36a", "37", "52", "56", "57",
        "58", "85x"]

relevantFields = ["RecordedAtTime", "VehicleRef", "OriginStopID", "DestinationStopID", "Direction",
                  "Bearing", "DelaySeconds", "Lat", "Long", "routeId", "DepartureTime"]

def get_bus_data():

    bus_data = {}

    for route_id in ROUTE_IDS:
        apiCall = "https://www.metlink.org.nz/api/v1/ServiceLocation/{}/".format(route_id)

        success = False
        while not success:
            try:
                request = urllib.request.Request(apiCall)
                result = urllib.request.urlopen(request)
                success = True
            except:
                print('Request Denied. Sleeping for 2 second.')
                time.sleep(2)

        result_text = result.read()
        js = json.loads(result_text)

        for bus in js['Services']:
            routeId = bus['Service']['TrimmedCode']
            bus['routeId'] = routeId
            vehicleRef = bus['VehicleRef']

            for key in list(bus.keys()).copy():
                if key not in relevantFields:
                    bus.pop(key)

            bus_data[vehicleRef] = bus

    return bus_data

def store(js):
    filename = time.strftime('%Y-%m-%d %H%M') + '.json'
    if not os.path.exists(localdb_path):
        os.makedirs(localdb_path)
    file = open(localdb_path + filename, 'w')
    json.dump(js, file, indent=4)


    js["_id"] = filename

    historical_collection.insert_one(js)

    print("Saved data locally to {}{}".format(localdb_path, filename))

def collect_data():
    data = get_bus_data()
    print("FINISHED API REQUESTS\nResults: ")
    store(data)

if __name__ == "__main__":
    # client = MongoClient('mongodb://localhost:27017/')
    mongodb_client = MongoClient('localhost', 27017)
    db = mongodb_client['travis']
    historical_collection = db['historical']












































    scheduler = BackgroundScheduler()
    scheduler.add_job(collect_data, 'cron', minute='*/3')
    print('Starting Collection.')
    scheduler.start()

    while True:
        pass
