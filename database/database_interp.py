
from pymongo import MongoClient

from bson.codec_options import CodecOptions

import datetime
import pytz

MONGODB_PATH = 'localhost:27017'

mongodb_client = MongoClient('mongodb://' + MONGODB_PATH)
db = mongodb_client['travis']
# historical_collection = db['historical']
options = CodecOptions(tz_aware=True, tzinfo=pytz.timezone('Pacific/Auckland'))
historical_collection = db.get_collection('historical', codec_options=options)

start = datetime.datetime.fromisoformat("2019-04-29 14:06:33+12:00")
end = datetime.datetime.fromisoformat("2019-04-29 17:45:26+12:00")

data = historical_collection.find({"_id": {'$lt': end, '$gte': start}})

data = historical_collection.find({})

print(start)
print(end)
print()
for document in data:
    print(document["_id"])

