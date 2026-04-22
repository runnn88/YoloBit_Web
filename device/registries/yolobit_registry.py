from modules.yolobit_environment import YoloBitEnvironmentModule
from modules.yolobit_irrigation import YoloBitIrrigationModule


def get_modules():
    return [
        YoloBitEnvironmentModule(),
        YoloBitIrrigationModule(),
    ]
