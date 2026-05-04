import sys
import uselect


class YoloBitTerminalEchoModule:
    def __init__(self):
        self.poll_interval_ms = 500

    def setup(self, context):
        self.event_manager = context["event_manager"]
        self.event_manager.add_timer_event(self.poll_interval_ms, self.poll_terminal)
        print("USB terminal echo ready")

    def read_terminal_input(self):
        serial_poll = uselect.poll()
        serial_poll.register(sys.stdin, uselect.POLLIN)

        incoming = ""
        if serial_poll.poll(0):
            incoming = sys.stdin.read(1)

            while serial_poll.poll(0):
                incoming += sys.stdin.read(1)

        serial_poll.unregister(sys.stdin)
        return incoming

    def poll_terminal(self):
        incoming = self.read_terminal_input()
        message = incoming.strip()

        if message:
            print("USB ECHO:", message)
