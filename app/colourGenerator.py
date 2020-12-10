
import json, random

js = json.loads(open('colours.json').read())

for id, colour in js.items():
  print('"{}" : "hsl({})",'.format(id, ','.join([str(random.randint(0, 360)), str(100), str(random.randint(50, 90))])))
