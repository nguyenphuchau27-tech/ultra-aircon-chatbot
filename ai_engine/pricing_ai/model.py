from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class PricingInput(BaseModel):

    demand: float
    supply: float
    weather: str


class SmartPricing:

    def calculate_price(self, demand, supply, weather):

        base = 200000

        demand_factor = demand * 1.2

        supply_factor = max(1, (10 - supply))

        weather_factor = 1.5 if weather == "hot" else 1

        price = base * demand_factor * supply_factor * weather_factor

        return int(price)


pricing_engine = SmartPricing()


@app.get("/")
def root():
    return {"message": "Ultra Aircon Pricing AI running"}


@app.post("/predict")
def predict(data: PricingInput):

    price = pricing_engine.calculate_price(
        data.demand,
        data.supply,
        data.weather
    )

    return {
        "predicted_price": price
    }