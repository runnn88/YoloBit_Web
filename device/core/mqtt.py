class MQTTClientAdapter:
    def __init__(self, client_id, broker, port):
        self.client_id = client_id
        self.broker = broker
        self.port = port
        self.subscriptions = {}

    def connect(self):
        return True

    def publish(self, topic, payload):
        print("MQTT publish:", topic, payload)

    def subscribe(self, topic, callback):
        self.subscriptions[topic] = callback
        print("MQTT subscribe:", topic)
