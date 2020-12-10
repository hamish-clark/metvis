
import os, datetime, json, time, math

from flask import Flask, render_template, redirect, url_for
from flask import jsonify, request, session
from flask_cors import CORS

from flask_socketio import SocketIO, send, emit

import pprint
import pytz
import urllib.request
import geopy.distance

from apscheduler.schedulers.background import BackgroundScheduler

from app.gtfs_to_json import load_gtfs_data

from pymongo import MongoClient
from bson.codec_options import CodecOptions
from bson.json_util import loads, dumps
from bson.json_util import JSONOptions

import string
from random import choice, randint


def generate_random_code():
    code_length = 16
    allchar = string.ascii_letters + string.digits
    password = "".join(choice(allchar) for x in range(randint(0, code_length)))
    return password

app = Flask("amy", template_folder='app/templates', static_folder='app/static')
app.debug = False
app.secret_key = generate_random_code()
CORS(app)
socketio = SocketIO(app)

json_options = JSONOptions()
json_options.datetime_representation = 2


"""
Web Helper Functions and String Processing Functions
"""

def load_json(file_path):
    """-
    Returns a given json file as a Dictionary
    """

    
    with open(file_path, 'r') as json_file:
        # print(file_path)
        dictionary = json.loads(json_file.read())

    return dictionary

def fetch_json(url):
    """
    Returns a python dictionary of a given resource at 'url' if the page contains raw json.
    """

    request = urllib.request.Request(url)
    result = urllib.request.urlopen(request)
    result_text = result.read()
    js = json.loads(result_text)
    return js


def string_to_json_position(x):
    """
    Converts a string into a json lat/lng blob.

    >>> string_to_json_position('-41.2233303,174.8049636')
    {'lat': -41.2233303, 'lng': 174.8049636}
    """

    s = x.split(',')
    return {'lat': float(s[0]), 'lng': float(s[1])}


def filename_to_time(filename):
    """
    Converts the data's filename into a 4 digit time code that rounds down to the nearest 3 minute interval

    >>> filename_to_time('2018-11-29 0730.csv')
    '0730'
    >>> filename_to_time('2018-11-29 1314.csv')
    '1312'
    """

    time_string = filename[11:15]  # Retrieve the 24h time integer from the filename.
    minutes = int(time_string[2:])  # Get the minutes from the timeString
    time = int(time_string) - (minutes % 3)  # Make the time a multiple of 3 minutes.
    time = str(time).zfill(4)  # Insert leading zeros to be in correct HHMM format.
    return time


def filename_to_date(filename):
    return filename[0:10]



def interpolate_array(arr):
    newArr = [None for i in range(len(arr))]
    i = 0
    v = 0

    prev = next((x for i, x in enumerate(arr) if x != None), None)

    while i < len(arr) and v < len(arr):
        current = arr[v]

        if current == None:
            v += 1
        else:
            x = (current - prev) / (v - i + 1)
            while i <= v:
                prev += x
                newArr[i] = round(prev, 1)
                i += 1
            v += 1
            prev = current

    last = [x for x in arr if x != None][-1]
    return [x if x != None else last for x in newArr]


"""
Bus Service "Interface" and it's implimented Classes
"""

class BusService:
    """
    Object used to represent a bus service for viewing historical data and general transit information
    with json formatted values.
    """

    name = 'Bus Service'

    def __init__(self, root_path, historical_collection, load_from_date):
        self.root_path = root_path
        self.gtfs = load_gtfs_data(self.root_path)
        self.last_updated = datetime.datetime.fromisoformat("{} 00:00:00+12:00".format(load_from_date))
        self.end_date = "2019-06-17 00:00:00+12:00"
        self.data = {}
        self.tracked_trips = {}
        self.load_historical_data(historical_collection)
        self.test_data_trip_id_integrity(self.data)
        self.generate_tracked_trips()

    def get_data(self):
        return self.data

    """
    Given dates ['2019-01-01', '2019-02-04', '2019-02-17', '2019-02-21', '2019-05-02', '2019-06-05']
    """
    def get_gtfs(self, date):
        keys = list(self.gtfs.keys()) 
        keys.sort()
        
        for key in keys:
            if date >= key:
                chosen_gtfs_key = key

        # print("from {} got gtfs {}".format(date, chosen_gtfs_key))
        return self.gtfs[chosen_gtfs_key]

    def get_info(self):
        return self.gtfs

    def load_historical_data(self, historical_collection):
        """
        :return data:
        """

        data = historical_collection.find({"_id": {'$gte': self.last_updated}}).batch_size(120)

        for document in data:
            # Remove the id from the document by getting the $date object and assign
            # each array to that id in json format.
            _id = document["_id"]

            date_str = str(_id.date())
            hh, mm = [int(x) for x in str(_id.time())[:5].split(":")]
            time_str = str(hh).zfill(2) + str(mm - (mm%3)).zfill(2) 

            # Convert the mongo document in a python dictionary
            document = json.loads(dumps(document, json_options=json_options))

            document.pop("_id")
            datetime_entry = self.data.setdefault(date_str, {"times": {}})

            datetime_entry["times"].setdefault(time_str, document)
                      
            # pprint.pprint(document)
            r = trip_collection.find_one({"_id": str(_id)})
            if r==None:
                changes = self.process_document(document)
                changes["_id"] = str(_id)
                trip_collection.insert_one(changes)
                r = changes

            r.pop("_id")
            # r = json.loads(dumps(r, json_options=options))

            for key, fields in r.items():
                for fieldname, value in fields.items():
                    document[key][fieldname] = value


            d = datetime.datetime.fromisoformat("{} 00:00:00+12:00".format(date_str))

            datetime_entry["day"] = (d.weekday()+1) % 7

            self.data[date_str] = datetime_entry

            self.last_updated = _id

            print(str(_id)[:-6], "Vehicles:", str(len(document)).zfill(3), "#" * int(len(document)/10))

    def process_document(self, document):
        d = list(document.items())
        if len(d) > 0:
            date = d[0][1]["RecordedAtTime"][0:10]
        else:
            return {}
        gtfs = self.get_gtfs(date)
        changes = {}
        for bus_id, bus in document.copy().items():
            changes[bus_id] = {}
            if 'DepartureTime' in bus:
                time = bus['DepartureTime'].split('T')[1][:5].split(':')
                time = (60 * int(time[0]) + int(time[1])) * 60
                # 2018-12-20T15:20:00+13:00
                key = '{}.0_{}_{}'.format(time, bus['OriginStopID'], bus['DestinationStopID'])

                if key in gtfs["trip_map"]:
                    trip_id = gtfs["trip_map"][key][0]
                    closest_stop = self.find_nearest_stop(gtfs, trip_id, bus['Lat'], bus['Long'])
                    changes[bus_id]['nearestStop'] = closest_stop
                    changes[bus_id]['tripId'] = trip_id
                else:
                    changes[bus_id]['tripId'] = 'Unnasigned'
                    changes[bus_id]['nearestStop'] = 'null'
            else:
                changes[bus_id]['tripId'] = 'Unnasigned'
                changes[bus_id]['nearestStop'] = 'null'

        return changes

    def find_nearest_stop(self, gtfs, trip_id, lat, long):
        """
        Returns the nearest stop to a bus by finding the minimum distance from each stop in stop_ids
        """
        stop_ids = [stop_times['stop_id'] for stop_times in gtfs["stop_times"][trip_id]]
        min_distance = 10000000
        closest_stop = stop_ids[0]
        for stop_id in stop_ids:
            stop = gtfs["stops"][stop_id]
            distance = geopy.distance.distance((lat, long), (stop['stop_lat'], stop['stop_lon'])).km
            if distance < min_distance:
                closest_stop_id = stop_id
                min_distance = distance
        return closest_stop_id

    def generate_tracked_trips(self):
        self.tracked_trips = {}

        for date, times in self.data.items():
            for time, vehicles in times["times"].items():
                for vehicleId, vehicle in vehicles.items():

                    if "tripId" in vehicle:
                        tripId = vehicle["tripId"]

                        if tripId != "Unnasigned":
                            dates = self.tracked_trips.setdefault(tripId, {})
                            day = dates.setdefault(date, [])
                            day.append(vehicle)

        for tripId, dates in self.tracked_trips.items():
            for date, vehicles in dates.items():
                stop_times = self.get_gtfs(date)["stop_times"][tripId]
                stop_delay_map = {}
                for vehicle in vehicles:
                    stop_delays = stop_delay_map.setdefault(vehicle["nearestStop"], [])
                    stop_delays.append(vehicle["DelaySeconds"])

                stop_delay_map = {k: sum(v) / len(v) for k, v in stop_delay_map.items()}

                new_trip = [None for i in range(len(stop_times))]

                index = 0
                while index < len(stop_times):
                    stop = stop_times[index]
                    s = index
                    while s < len(stop_times):
                        stop_id = stop_times[s]["stop_id"]
                        if stop_id in stop_delay_map:
                            new_trip[s] = stop_delay_map[stop_id]
                            new_trip[s]
                            break
                        s += 1

                    index += 1

                interpolated_delays = interpolate_array(new_trip)
                m = [[stop_times[i]["stop_id"], interpolated_delays[i]] for i in range(len(stop_times))]
                self.tracked_trips[tripId][date] = m

        return self.tracked_trips

    def test_data_trip_id_integrity(self, historical_data):
        print("test_data_trip_id_integrity()", end=' ')
        for date, times in historical_data.items():
            for time, vehicles in times["times"].items():
                for vehicleId, vehicle in vehicles.items():
                    # print(vehicle)
                    assert "tripId" in vehicle, "tripId not found on vehicle {} at {} {}".format(vehicleId, date, time)

        print("Passed.")

"""
Flask REST Endpoints.
"""

# def login_required(*args, **kwargs):
#     def decorator():
#         redirect("login")
#
#   return decorator


def curl_test():
    """
    curl
    """
    print("Test lmao")


"""
REST endpoint for getting bus data over the whole day for a given date
CURL: localhost:5000/data/historical/2019-04-29
RETURNS: JSON <timestamp : bus_array>
"""

@app.route("/data/historical/<date>", methods=['GET'])
def historical(date):
    data = metlink.get_data()
    if date in data.keys():
        res = jsonify({date : metlink.get_data()[date]})
    else:
        res = jsonify({})

    # recent_data = {key : value for key, value in data.items() if key>=date}
    # res = jsonify(recent_data)

    # res.headers.set('Cache-Control', 'max-age=31556926')
    return res


@app.route("/data/gtfs", methods=['GET'])
def gtfs():
    res = jsonify({"wellington" : metlink.get_gtfs("2019-06-15")})
    res.headers.set('Cache-Control', 'max-age=31556926')
    return res


@app.route("/data/trip/<string:tripId>/<string:date>", methods=['GET'])
def get_trip(tripId, date):
    print(tripId, date)
    theTrip = []
    trips = metlink.tracked_trips

    try:
        res = jsonify(trips[tripId])
    except:
        res = jsonify(["Invalid request"])

    # res.headers.set('Cache-Control', 'max-age=31556926')
    return res    


@app.route("/data/tracked_trips", methods=['GET'])
def tracked_trips():
    res = jsonify(metlink.tracked_trips)
    res.headers.set('Cache-Control', 'max-age=31556926')
    return res


# @app.route("/data/snapper/<date>/<depart_time>/<direction>/<route_id>", methods=['GET'])
@app.route("/data/snapper/<date>/<route_id>", methods=['GET'])
def get_snapper_data(date, route_id):
    # get the entries on a given date

    #print(date, depart_time, direction, route_id)
    print(date, route_id)
    response = []
    result = snapper_collection.aggregate([
        # {"$match" : {"duty_date":date, "trip_depart_time":depart_time, "route_id":route_id, "direction_id":direction}}
        
        {"$match" : {"duty_date":date, "route_id":route_id}}
    ])


    for document in result:
        document = json.loads(dumps(document, json_options=json_options))

        has_nan = False

        for key, value in document.items():
            if (type(value)==type(0.0) and math.isnan(value)):
                has_nan = True

        if not has_nan:
            response.append(document)
        
    res = jsonify(response)
    # res.headers.set('Cache-Control', 'max-age=31556926')
    return res

@app.route("/")
def index():
    return render_template('index.html', config=str(config))
    # return redirect(url_for("login"))


@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        body = request.get_json()
        print("assigning session code to", body['code'])
        session['code'] = body['code']
        return redirect(url_for("index"))

    elif 'code' in session and session['code']==SERVER_PASSWORD:
        return redirect(url_for("index"))
    else:
        return render_template('app/login.html')


@app.route("/conf", methods=['GET'])
def conf():
    return jsonify(config)


@app.route("/reload", methods=['GET'])
def reload():
    print("Loading new Data")
    metlink.load_historical_data(historical_collection)
    socketio.emit('new data', {})
    return jsonify({"result": "success"})


try:
    config = load_json('config.json')
except:
    config = { key : os.getenv(key) for key in ['run_type', 'server_path', 'server_port', 'mongodb_url', 'start_date'] }

RUN_TYPE        = config["run_type"]
SERVER_PATH     = config["server_path"]
SERVER_PORT     = config["server_port"]
MONGODB_PATH    = config["mongodb_url"]

SERVER_PASSWORD = "1234"

START_DATE = config["start_date"]
    
mongodb_client = MongoClient('mongodb://' + MONGODB_PATH)
db = mongodb_client['travis']
options = CodecOptions(tz_aware=True, tzinfo=pytz.timezone('Pacific/Auckland'))

historical_collection = db.get_collection('historical', codec_options=options)
trip_collection = db.get_collection('historical_trip', codec_options=options)
snapper_collection = db.get_collection('snapper', codec_options=options)

print("TrafficVis Prediction Service.")

metlink = BusService('app/metlink/', historical_collection, START_DATE)

# start_scheduler()

if __name__ == "__main__":
    if RUN_TYPE == "deploy":
        socketio.run(app, '0.0.0.0', port=SERVER_PORT)
    else:
        socketio.run(app)
