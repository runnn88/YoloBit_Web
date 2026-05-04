import React, { useState } from "react";
import { useYoloBitUsb } from "./YoloBitUsbContext";

export function UsbSerialPanel() {
  const [command, setCommand] = useState("hello from dashboard");
  const {
    baudRate,
    connectUsb,
    consoleLines,
    disconnectUsb,
    isConnected,
    sendCommand: sendUsbCommand,
    sendInterrupt,
    serialSupported,
    setBaudRate,
    statusMessage,
  } = useYoloBitUsb();

  async function handleSendCommand() {
    await sendUsbCommand(command);
  }

  return (
    <section className="setup-guide">
      <div className="setup-guide-header">
        <p className="eyebrow">Direct USB</p>
        <h2>Talk to the YoloBit over the USB port</h2>
        <p>
          This uses the browser Web Serial API, so it works best in Chromium-based browsers such as Microsoft Edge or
          Google Chrome.
        </p>
      </div>

      <div className="setup-grid">
        <article className="setup-card">
          <h3>USB link</h3>
          <p>Status: <code>{statusMessage}</code></p>
          <p>Browser support: {serialSupported ? "Web Serial available" : "Web Serial not available"}</p>

          <label className="field-label" htmlFor="baud-rate">
            Baud rate
          </label>
          <input
            className="text-input"
            id="baud-rate"
            onChange={(event) => setBaudRate(event.target.value)}
            value={baudRate}
          />

          <div className="connection-actions">
            <button className="primary-action" disabled={isConnected || !serialSupported} onClick={connectUsb} type="button">
              Connect USB
            </button>
            <button className="secondary-action" disabled={!isConnected} onClick={disconnectUsb} type="button">
              Disconnect
            </button>
            <button className="secondary-action" disabled={!isConnected} onClick={sendInterrupt} type="button">
              Send Ctrl+C
            </button>
          </div>
        </article>

        <article className="setup-card">
          <h3>Send command</h3>
          <p>
            For a quick connection test, send plain text here. The YoloBit echo module should print the same text back
            into the USB console.
          </p>
          <label className="field-label" htmlFor="usb-command">
            Serial command
          </label>
          <textarea
            className="text-area"
            id="usb-command"
            onChange={(event) => setCommand(event.target.value)}
            rows={4}
            value={command}
          />
          <div className="connection-actions">
            <button className="primary-action" disabled={!isConnected} onClick={handleSendCommand} type="button">
              Send to YoloBit
            </button>
          </div>
        </article>
      </div>

      <article className="setup-card usb-console-card">
        <h3>USB console</h3>
        <pre className="usb-console">{consoleLines.join("\n")}</pre>
      </article>
    </section>
  );
}
