#!/usr/bin/env python

import os
import sys
import json
import datetime
import time
import urllib.request

from pymongo import MongoClient
from apscheduler.schedulers.background import BackgroundScheduler


def load_json(file_path):
    """
    Returns a given json file as a Dictionary
    """

    with open(file_path, 'r') as json_file:
        # print(file_path)
        dictionary = json.loads(json_file.read())

    return dictionary

config = load_json('config.json')

MONGODB_PATH = config['mongodb_url']
APP_PATH = config['server_path']

ROUTE_IDS = [
        "1", "2", "3", "3a", "7", "12", "12e", "13", "14", "17", "17e", "18", "18e", "19e", "20", "21", "22",
        "23e", "24", "25", "26", "29e", "30x", "31x", "32x", "33", "34", "35", "36", "36a", "37", "52", "56", "57",
        "58", "85x"]

relevantFields = ["RecordedAtTime", "VehicleRef", "OriginStopID", "DestinationStopID", "Direction",
                  "Bearing", "DelaySeconds", "Lat", "Long", "routeId", "DepartureTime"]

def load_metlink_service_location(route_id):
    """
    :param String route_id - Route id to retrieve busses from.
    :return: Dict - json service locations.
    """

    apiCall = "https://www.metlink.org.nz/api/v1/ServiceLocation/{}/".format(route_id)

    try:
        request = urllib.request.Request(apiCall)
        result = urllib.request.urlopen(request)
        success = True
    except:
        return False

    result_text = result.read()
    js = json.loads(result_text)

    return js


def ping_front_end_service():
    try:
        request = urllib.request.Request("http://localhost:5000/reload")
        result = urllib.request.urlopen(request)
        result_text = result.read()
        js = json.loads(result_text)
    except:
        return False

    return js


def get_bus_data():
    n_columns = 20
    n_active_busses = 0
    bus_data = {}
    for route_id in ROUTE_IDS:

        js = load_metlink_service_location(route_id)
        while not js:
            print("... ", end = ' ')
            time.sleep(2)
            js = load_metlink_service_location(route_id)

        timestamp = js["LastModified"]

        for bus in js['Services']:

            n_active_busses += 1

            print(bus["VehicleRef"], end = ' ')
            if (n_active_busses % n_columns) == 0:
                print()

            routeId = bus['Service']['TrimmedCode']
            bus['routeId'] = routeId
            vehicleRef = bus['VehicleRef']

            for key in list(bus.keys()).copy():
                if key not in relevantFields:
                    bus.pop(key)

            bus_data[vehicleRef] = bus

    if n_active_busses%n_columns != 0: print()

    dt = datetime.datetime.fromisoformat(timestamp)
    bus_data["_id"] = dt

    print("Completed retrieval for " + str(dt))
    return bus_data

def collect_data():
    data = get_bus_data()
    historical_collection.insert_one(data)
    ping_front_end_service()


def test_passed_endpoints():
    print("TESTS")
    if load_metlink_service_location("2"):
        print("Succesfully queried a metlink service")
    else:
        print("Couldnt connect to metlinks server")

    if ping_front_end_service() == "success":
        print("Succesfully queried the frontend application to reload data")
    else:
        print("Coul not find the front end service")


if __name__ == "__main__":

    test_passed_endpoints()

    mongodb_client = MongoClient("mongodb://" + MONGODB_PATH)
    db = mongodb_client['travis']
    historical_collection = db['historical']

    scheduler = BackgroundScheduler()
    scheduler.add_job(collect_data, 'cron', minute='*/3')

    print('Starting Collection.', end = '\n')
    scheduler.start()

    collect_data()

    while True:
        pass
