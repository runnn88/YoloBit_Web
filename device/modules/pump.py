class Pump:
    def __init__(self, device_id="pump-001"):
        self.device_id = device_id
        self.enabled = False

    def control_topic(self):
        return "farm/control/pump/set"

    def handle(self, msg):
        command = msg.decode() if hasattr(msg, "decode") else str(msg)
        self.enabled = command.upper() == "ON"
        print("Pump state:", self.enabled)
