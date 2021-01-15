

import os
import random
import json
import re
import datetime
from json import JSONEncoder

import pandas as pd
import partridge as ptg


class MyEncoder(JSONEncoder):
    def default(self, value):
        print(value)
        return str(value)

pd.set_option('display.max_rows', 5)
pd.set_option('display.max_columns', 500)
pd.set_option('display.width', 1000)


def load_json(file_path):
    """
    Returns a given json file as a Dictionary
    """

    with open(file_path, 'r') as json_file:
        # print(file_path)
        dictionary = json.loads(json_file.read())

    return dictionary


def load_stops(feed):
    """
    Routes
    :param feed:
    :return Dict():
    """

    stops_json = {}
    stops = feed.stops
    stops.fillna('nan', inplace=True)

    print(stops)

    for index, row in stops.iterrows():
        json_row = row.to_dict()
        json_row = {k: v for k, v in json_row.items() if k in ['stop_id', 'stop_lat', 'stop_lon', 'stop_name', 'location_type']}
        stop_id = json_row.pop('stop_id')
        stops_json[stop_id] = json_row

    return stops_json


def load_routes(feed):
    """
    Routes
    :param feed:
    :return Dict():
    """

    routes_json = {}
    routes = feed.routes
    #routes.fillna('nan', inplace=True)
    print(routes)

    for index, row in routes.iterrows():
        json_row = row.to_dict()
        json_row = {k: v for k, v in json_row.items() if k in ['route_id', 'route_long_name', 'route_short_name']}


        if str(json_row['route_short_name'])=='nan':
            json_row['route_short_name'] = json_row['route_id']

        route_id = json_row.pop('route_id')
        routes_json[route_id] = json_row

    return routes_json


def load_trips(feed):
    """
    Trips
    """

    trips_json = {}
    trips = feed.trips
    trips.fillna('nan', inplace=True)
    print(trips)

    for index, row in trips.iterrows():
        json_row = row.to_dict()
        json_row = {k: v for k, v in json_row.items() if k in ['trip_id', 'route_id', 'service_id', 'direction_id', 'shape_id']}
        trip_id = json_row.pop('trip_id')
        trips_json[trip_id] = json_row

    return trips_json


def load_shapes(feed):
    """
    Shapes
    """

    shapes_json = {}
    shapes = feed.shapes
    shapes.fillna('nan', inplace=True)
    shape_ids = shapes.shape_id.unique()

    for shape_id in shape_ids:
        shape_data = shapes.loc[shapes['shape_id'] == shape_id]
        point_array = []
        for index, row in shape_data.iterrows():
            point_array.append({'lat': row['shape_pt_lat'], 'lng': row['shape_pt_lon']})
        shapes_json[shape_id] = point_array

    return shapes_json


def get_route_shorts(feed):
    tracked_routes = set(json.load(open('colours.json')).keys())

    routes = feed.routes

    # Get all the unique route_short_names
    route_short_names = routes.route_short_name.unique()

    tracked_short_routes = []
    for route_short_name in route_short_names:
        r = routes.loc[routes['route_short_name'] == route_short_name]
        r = set(r.route_id.tolist())
        if bool(r & tracked_routes): #the route_ids for a given short_name are meant to be tracked
            tracked_short_routes.append(route_short_name)

    print('{')
    for sh in tracked_short_routes:
        print('"{}" : "rgb({})",'.format(sh, ','.join([str(random.randint(0, 255)) for x in range(3)])))
    print('}')
#print(routes.sort_values(by=['route_short_name']))


def load_stop_times(feed):

    stop_times_json = {}
    stop_times = feed.stop_times
    stop_times.fillna('nan', inplace=True)

    for index, row in stop_times.iterrows():
        json_row = row.to_dict()
        json_row = {k: v for k, v in json_row.items() if k in ['trip_id', 'arrival_time', 'departure_time', 'stop_id']}
        trip_id = json_row.pop('trip_id')

        stop_times = stop_times_json.setdefault(trip_id, [])
        stop_times.append(json_row)

    return stop_times_json


dateRegex = re.compile('[0-9]{4}-[0-9]{2}-[0-9]{2}')

def load_gtfs_data(root_path):
    gtfs = {}
    for filename in os.listdir(root_path):
        if filename.startswith("gtfs") and not filename.endswith(".zip"):  # A gtfs json folder
            print(filename)
            date = re.findall(dateRegex, filename)[0]
            folder_path = "{}gtfs_{}/".format(root_path, date)

            routes = load_json(folder_path + 'routes.json')
            shapes = load_json(folder_path + 'shapes.json')
            trips = load_json(folder_path + 'trips.json')
            stops = load_json(folder_path + 'stops.json')
            colours = load_json(folder_path + 'colours.json')
            stop_times = load_json(folder_path + 'stop_times.json')
            trip_map = get_trip_map(trips, stop_times)

            gtfs[date] = {"routes": routes, "shapes": shapes, "trips": trips, "colours": colours,
                          "stops": stops, "stop_times": stop_times, "trip_map": trip_map}


    return gtfs

def get_trip_map(trips, stop_times):
    """
    Generates a dictionary that maps a Trip start_time, first stop_id and last stop_id to a given trip_id
    for the metlink ServiceMap data that contains no trip information
    """
    g = trips
    s = stop_times
    trip_map = {}
    for trip_id in g:
        trip = s[trip_id]
        start_time_secs = trip[0]['departure_time']
        start_stop_id = trip[0]['stop_id']
        end_stop_id = trip[-1]['stop_id']
        key = '{}_{}_{}'.format(start_time_secs, start_stop_id, end_stop_id)
        trip_ids = trip_map.setdefault(key, [])
        trip_ids.append(trip_id)
    return trip_map

if __name__ == "__main__":
    for root_path in ['metlink/']:
        for filename in os.listdir(root_path):
            if filename.startswith("gtfs") and filename.endswith(".zip"): # A gtfs zip file
                date = re.findall(dateRegex, filename)[0]
                print("Loading GTFS file for " + date)

                folder_path = root_path + "gtfs_" + date + "/"
                os.makedirs(folder_path,exist_ok=True)

                feed = ptg.load_feed(root_path + filename)

                json.dump(load_stops(feed), open(folder_path + 'stops.json', 'w'), indent=4)
                json.dump(load_routes(feed), open(folder_path + 'routes.json', 'w'), indent=4)
                json.dump(load_shapes(feed), open(folder_path + 'shapes.json', 'w'), indent=4)
                json.dump(load_trips(feed), open(folder_path + 'trips.json', 'w'), indent=4)
                json.dump(load_stop_times(feed), open(folder_path + 'stop_times.json', 'w'), indent=4)

                #get_route_shorts(feed)
