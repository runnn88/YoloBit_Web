from config import MQTT_BROKER, MQTT_CLIENT_ID, MQTT_PORT, PUBLISH_INTERVAL_MS, WIFI_PASSWORD, WIFI_SSID
from core.mqtt import MQTTClientAdapter
from core.scheduler import every
from core.wifi import connect
from registry import get_modules


def main():
    connect(WIFI_SSID, WIFI_PASSWORD)

    mqtt = MQTTClientAdapter(MQTT_CLIENT_ID, MQTT_BROKER, MQTT_PORT)
    mqtt.connect()

    modules = get_modules()

    for module in modules:
        control_topic = getattr(module, "control_topic", lambda: None)()
        if control_topic:
            mqtt.subscribe(control_topic, module.handle)

    def publish_readings():
        for module in modules:
            if hasattr(module, "read"):
                mqtt.publish(module.topic(), module.read())

    every(PUBLISH_INTERVAL_MS, publish_readings)


if __name__ == "__main__":
    main()
