class YoloBitIrrigationModule:
    def __init__(self, device_id="pump-001"):
        self.device_id = device_id
        self.publish_interval_ms = 5000

    def setup(self, context):
        self.mqtt = context["mqtt"]
        self.event_manager = context["event_manager"]
        self.rtc = context["rtc"]
        self.pump_pin = context["pump_pin"]

        self.event_manager.add_timer_event(self.publish_interval_ms, self.apply_schedule)

    def apply_schedule(self):
        current_minutes = int(f"{self.rtc().datetime()[4]:02d}") * 60
        current_minutes += int(f"{self.rtc().datetime()[5]:02d}")

        if current_minutes > 660:
            self.set_pump(True)
        if current_minutes > 675:
            self.set_pump(False)
        if current_minutes > 900:
            self.set_pump(True)
        if current_minutes > 915:
            self.set_pump(False)

    def set_pump(self, enabled):
        self.pump_pin.write_digital(1 if enabled else 0)
        self.mqtt.publish("V11", "1" if enabled else "0")
