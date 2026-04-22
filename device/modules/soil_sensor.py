class SoilSensor:
    def __init__(self, device_id="soil-001"):
        self.device_id = device_id

    def topic(self):
        return "farm/sensor/soil/value"

    def read(self):
        return {
            "deviceId": self.device_id,
            "metric": "soil",
            "value": 43,
        }
