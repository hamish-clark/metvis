from pymongo import MongoClient

MONGODB_PATH = "localhost:56126";

print("Hello World")

mongodb_client = MongoClient("mongodb://" + MONGODB_PATH)
db = mongodb_client['travis']
historical_collection = db['historical']

for entry in historical_collection.find({}):
    entry.pop("_id")
    print(len(entry))
    print()
