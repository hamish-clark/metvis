

import pandas as pd

data_path = 'metlink/ptbis_passenger_boardings_20190301_to_20190331.csv'

pd.set_option('display.max_rows', 5)
pd.set_option('display.max_columns', 500)
pd.set_option('display.width', 1000)

data = pd.read_csv(data_path)

data.head()
print(data)
