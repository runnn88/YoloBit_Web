class YoloBitDisplayModule:
    def __init__(self):
        self.poll_interval_ms = 1000

    def setup(self, context):
        self.display = context["display"]
        self.rtc = context["rtc"]
        self.temperature = context["temperature"]
        self.light_level = context["light_level"]
        self.time_touch_pin = context["time_touch_pin"]
        self.date_touch_pin = context["date_touch_pin"]
        self.button_a = context["button_a"]
        self.button_b = context["button_b"]
        self.event_manager = context["event_manager"]

        self.button_a.on_pressed = self.show_temperature
        self.button_b.on_pressed = self.show_light_level
        self.button_a.on_pressed_ab = self.button_b.on_pressed_ab = -1

        self.display.scroll("YOLOBIT")
        self.event_manager.add_timer_event(self.poll_interval_ms, self.check_touch_inputs)

    def show_temperature(self):
        self.display.scroll(self.temperature())

    def show_light_level(self):
        self.display.scroll(self.light_level())

    def check_touch_inputs(self):
        if self.time_touch_pin.is_touched():
            self.display.scroll("%0*d" % (2, self.rtc().datetime()[4]))
            self.display.scroll(":")
            self.display.scroll("%0*d" % (2, self.rtc().datetime()[5]))

        if self.date_touch_pin.is_touched():
            self.display.scroll("%0*d" % (2, self.rtc().datetime()[2]))
            self.display.scroll("-")
            self.display.scroll("%0*d" % (2, self.rtc().datetime()[1]))
