from modules.light import Light
from modules.pump import Pump
from modules.soil_sensor import SoilSensor
from modules.temp_sensor import TempSensor


def get_modules():
    return [
        TempSensor(),
        SoilSensor(),
        Pump(),
        Light(),
    ]
