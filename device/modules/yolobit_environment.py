class YoloBitEnvironmentModule:
    def __init__(self, device_id="yolobit-uno-001"):
        self.device_id = device_id
        self.publish_interval_ms = 5000

    def setup(self, context):
        self.mqtt = context["mqtt"]
        self.event_manager = context["event_manager"]
        self.dht20 = context["dht20"]
        self.pin1 = context["pin1"]
        self.pin2 = context["pin2"]
        self.translate = context["translate"]

        self.event_manager.add_timer_event(self.publish_interval_ms, self.publish_readings)

    def publish_readings(self):
        self.dht20.read_dht20()

        air_temperature = self.dht20.dht20_temperature()
        air_humidity = self.dht20.dht20_humidity()
        soil_moisture = self.translate(self.pin1.read_analog(), 0, 4096, 0, 100)
        light_level = self.pin2.read_analog()

        # These virtual topics match the current OhStem/YoloBit convention in the sample code.
        self.mqtt.publish("V1", air_temperature)
        self.mqtt.publish("V2", air_humidity)
        self.mqtt.publish("V3", soil_moisture)
        self.mqtt.publish("V4", light_level)

        return {
            "deviceId": self.device_id,
            "temp": air_temperature,
            "humidity": air_humidity,
            "soil": soil_moisture,
            "lux": light_level,
        }
