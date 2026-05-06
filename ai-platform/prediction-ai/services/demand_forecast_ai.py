import pandas as pd
from sklearn.linear_model import LinearRegression

def forecast_demand(data):

    df = pd.DataFrame(data)

    model = LinearRegression()

    X = df[['temperature','humidity']]
    y = df['orders']

    model.fit(X,y)

    prediction = model.predict([[35,70]])

    return prediction[0]