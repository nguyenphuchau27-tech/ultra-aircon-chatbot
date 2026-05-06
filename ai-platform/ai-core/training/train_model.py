import pandas as pd
from sklearn.ensemble import RandomForestRegressor

def train(data):

    df = pd.DataFrame(data)

    X = df[['distance','rating','jobs']]
    y = df['success']

    model = RandomForestRegressor()

    model.fit(X,y)

    return model