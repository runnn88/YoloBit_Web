import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

function formatError(error) {
  return error?.message || String(error);
}

function escapePythonString(value) {
  return JSON.stringify(String(value ?? ""));
}

function waitMs(durationMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

const YoloBitUsbContext = createContext(null);

export function YoloBitUsbProvider({ children }) {
  const [baudRate, setBaudRate] = useState("115200");
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("USB serial is idle.");
  const [consoleLines, setConsoleLines] = useState([
    "USB console ready. Connect the YoloBit with a Chromium-based browser, then choose its serial port.",
  ]);

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const writerRef = useRef(null);
  const readerClosedRef = useRef(null);
  const writerClosedRef = useRef(null);
  const shouldReadRef = useRef(false);

  const serialSupported = typeof navigator !== "undefined" && "serial" in navigator;

  function appendLine(line) {
    setConsoleLines((previous) => {
      const next = [...previous, line];
      return next.slice(-200);
    });
  }

  async function readLoop() {
    while (readerRef.current && shouldReadRef.current) {
      try {
        const { value, done } = await readerRef.current.read();

        if (done) {
          break;
        }

        if (value) {
          const chunks = value.split(/\r?\n/).filter(Boolean);
          if (chunks.length) {
            chunks.forEach((chunk) => appendLine(chunk));
          }
        }
      } catch (error) {
        appendLine(`Read error: ${formatError(error)}`);
        break;
      }
    }
  }

  async function disconnectUsb() {
    shouldReadRef.current = false;

    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
    } catch (error) {
      appendLine(`Reader shutdown error: ${formatError(error)}`);
    }

    try {
      if (writerRef.current) {
        await writerRef.current.close();
        writerRef.current.releaseLock();
        writerRef.current = null;
      }
    } catch (error) {
      appendLine(`Writer shutdown error: ${formatError(error)}`);
    }

    try {
      if (readerClosedRef.current) {
        await readerClosedRef.current;
        readerClosedRef.current = null;
      }
    } catch (error) {
      appendLine(`Reader pipeline error: ${formatError(error)}`);
    }

    try {
      if (writerClosedRef.current) {
        await writerClosedRef.current;
        writerClosedRef.current = null;
      }
    } catch (error) {
      appendLine(`Writer pipeline error: ${formatError(error)}`);
    }

    try {
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (error) {
      appendLine(`Port close error: ${formatError(error)}`);
    }

    setIsConnected(false);
    setStatusMessage("USB serial disconnected.");
  }

  async function connectUsb() {
    if (!serialSupported) {
      setStatusMessage("This browser does not support the Web Serial API.");
      return false;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: Number(baudRate) || 115200 });

      portRef.current = port;

      const textDecoder = new TextDecoderStream();
      readerClosedRef.current = port.readable.pipeTo(textDecoder.writable).catch(() => {});
      readerRef.current = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      writerClosedRef.current = textEncoder.readable.pipeTo(port.writable).catch(() => {});
      writerRef.current = textEncoder.writable.getWriter();

      shouldReadRef.current = true;
      setIsConnected(true);
      setStatusMessage(`Connected to serial port at ${baudRate} baud.`);
      appendLine(`Connected to USB serial at ${baudRate} baud.`);

      readLoop();
      return true;
    } catch (error) {
      setStatusMessage(`USB connection failed: ${formatError(error)}`);
      appendLine(`USB connection failed: ${formatError(error)}`);
      return false;
    }
  }

  async function sendCommand(command) {
    if (!writerRef.current) {
      setStatusMessage("Connect to a USB serial port before sending commands.");
      return false;
    }

    try {
      await writerRef.current.write(`${command}\r\n`);
      appendLine(`> ${command}`);
      setStatusMessage("Command sent to USB serial device.");
      return true;
    } catch (error) {
      setStatusMessage(`Send failed: ${formatError(error)}`);
      appendLine(`Send failed: ${formatError(error)}`);
      return false;
    }
  }

  async function sendInterrupt() {
    if (!writerRef.current) {
      setStatusMessage("Connect to a USB serial port before sending Ctrl+C.");
      return false;
    }

    try {
      await writerRef.current.write("\u0003");
      appendLine("> [Ctrl+C]");
      setStatusMessage("Interrupt signal sent.");
      return true;
    } catch (error) {
      setStatusMessage(`Interrupt failed: ${formatError(error)}`);
      appendLine(`Interrupt failed: ${formatError(error)}`);
      return false;
    }
  }

  async function sendSoftReset() {
    if (!writerRef.current) {
      setStatusMessage("Connect to a USB serial port before sending Ctrl+D.");
      return false;
    }

    try {
      await writerRef.current.write("\u0004");
      appendLine("> [Ctrl+D]");
      setStatusMessage("Soft reset signal sent.");
      return true;
    } catch (error) {
      setStatusMessage(`Soft reset failed: ${formatError(error)}`);
      appendLine(`Soft reset failed: ${formatError(error)}`);
      return false;
    }
  }

  async function sendLeafCommand(code) {
    const normalized = String(code || "").trim().toUpperCase();

    if (normalized === "A") {
      return sendCommand(
        "from yolobit import *; from homebit3_rgbled import RGBLed; tiny_rgb = RGBLed(pin0.pin, 4); tiny_rgb.show(0, hex_to_rgb('#ffff00')); pin4.servo_write(0); print('LA VANG')",
      );
    }

    if (normalized === "B") {
      return sendCommand(
        "from yolobit import *; from homebit3_rgbled import RGBLed; tiny_rgb = RGBLed(pin0.pin, 4); tiny_rgb.show(0, hex_to_rgb('#00ff00')); pin4.servo_write(180); print('LA XANH')",
      );
    }

    return false;
  }

  async function showDisplayText(message) {
    return sendCommand(`from yolobit import *; display.scroll(${escapePythonString(message)})`);
  }

  async function showTemperature() {
    return sendCommand("from yolobit import *; display.scroll(temperature())");
  }

  async function showLightLevel() {
    return sendCommand("from yolobit import *; display.scroll(light_level())");
  }

  async function showTime() {
    return sendCommand(
      "from machine import RTC; from yolobit import *; display.scroll('%0*d' % (2, RTC().datetime()[4])); display.scroll(':'); display.scroll('%0*d' % (2, RTC().datetime()[5]))",
    );
  }

  async function showDate() {
    return sendCommand(
      "from machine import RTC; from yolobit import *; display.scroll('%0*d' % (2, RTC().datetime()[2])); display.scroll('-'); display.scroll('%0*d' % (2, RTC().datetime()[1]))",
    );
  }

  async function uploadScriptAsMain(scriptText) {
    if (!writerRef.current) {
      setStatusMessage("Connect to a USB serial port before uploading a script.");
      return false;
    }

    const normalized = String(scriptText || "").replace(/\r\n/g, "\n");

    if (!normalized.trim()) {
      setStatusMessage("Script upload skipped because the script is empty.");
      return false;
    }

    try {
      appendLine("Starting upload of main.py...");
      await sendInterrupt();
      await waitMs(150);
      await sendInterrupt();
      await waitMs(150);
      await sendCommand("f = open('main.py', 'w')");
      await waitMs(120);

      for (let index = 0; index < normalized.length; index += 180) {
        const chunk = normalized.slice(index, index + 180);
        await sendCommand(`f.write(${escapePythonString(chunk)})`);
        await waitMs(80);
      }

      await sendCommand("f.close()");
      await waitMs(120);
      await sendCommand("print('UPLOAD_OK: main.py')");
      setStatusMessage("Uploaded main.py to the YoloBit.");
      appendLine("Upload complete: main.py");
      return true;
    } catch (error) {
      setStatusMessage(`Upload failed: ${formatError(error)}`);
      appendLine(`Upload failed: ${formatError(error)}`);
      return false;
    }
  }

  useEffect(() => {
    return () => {
      disconnectUsb();
    };
  }, []);

  const value = useMemo(
    () => ({
      baudRate,
      connectUsb,
      consoleLines,
      disconnectUsb,
      isConnected,
      sendCommand,
      sendInterrupt,
      sendSoftReset,
      showDate,
      showDisplayText,
      showLightLevel,
      showTemperature,
      showTime,
      sendLeafCommand,
      serialSupported,
      setBaudRate,
      statusMessage,
      uploadScriptAsMain,
    }),
    [baudRate, consoleLines, isConnected, serialSupported, statusMessage],
  );

  return <YoloBitUsbContext.Provider value={value}>{children}</YoloBitUsbContext.Provider>;
}

export function useYoloBitUsb() {
  const context = useContext(YoloBitUsbContext);

  if (!context) {
    throw new Error("useYoloBitUsb must be used inside YoloBitUsbProvider.");
  }

  return context;
}
