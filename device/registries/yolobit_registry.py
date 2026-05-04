from modules.yolobit_display import YoloBitDisplayModule
from modules.yolobit_environment import YoloBitEnvironmentModule
from modules.yolobit_irrigation import YoloBitIrrigationModule
from modules.yolobit_terminal_echo import YoloBitTerminalEchoModule


def get_modules():
    return [
        YoloBitDisplayModule(),
        YoloBitTerminalEchoModule(),
        YoloBitEnvironmentModule(),
        YoloBitIrrigationModule(),
    ]
