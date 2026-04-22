import time


def every(interval_ms, callback):
    while True:
        callback()
        time.sleep(interval_ms / 1000)
