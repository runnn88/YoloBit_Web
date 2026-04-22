class TempSensor:
    def __init__(self, device_id="temp-001"):
        self.device_id = device_id

    def topic(self):
        return "farm/sensor/temp/value"

    def read(self):
        return {
            "deviceId": self.device_id,
            "metric": "temp",
            "value": 27.5,
        }
