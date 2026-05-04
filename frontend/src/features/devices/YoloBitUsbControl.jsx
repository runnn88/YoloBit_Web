import React, { useState } from "react";
import { useYoloBitUsb } from "../connection/YoloBitUsbContext";
import { YoloBitScriptUploader } from "./YoloBitScriptUploader";

export function YoloBitUsbControl() {
  const [displayText, setDisplayText] = useState("YOLOBIT");
  const [rawCommand, setRawCommand] = useState("hello from homepage");
  const {
    baudRate,
    connectUsb,
    disconnectUsb,
    isConnected,
    sendCommand,
    sendLeafCommand,
    showDate,
    showDisplayText,
    showLightLevel,
    showTemperature,
    showTime,
    serialSupported,
    setBaudRate,
    statusMessage,
  } = useYoloBitUsb();

  async function handleSendRaw() {
    await sendCommand(rawCommand);
  }

  return (
    <section className="setup-card">
      <div className="setup-grid">
        <section className="setup-card">
          <h3>Direct YoloBit Control</h3>
          <p>
            Control the board straight from this webapp over USB by sending live MicroPython commands based on your
            sample logic. No OhStem control page is needed.
          </p>
          <p>Status: <code>{statusMessage}</code></p>
          <p>Browser support: {serialSupported ? "Web Serial available" : "Web Serial not available"}</p>

          <label className="field-label" htmlFor="homepage-baud-rate">
            Baud rate
          </label>
          <input
            className="text-input"
            id="homepage-baud-rate"
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
          </div>

          <div className="connection-actions">
            <button className="primary-action" disabled={!isConnected} onClick={() => sendLeafCommand("A")} type="button">
              Show Yellow Leaf
            </button>
            <button className="secondary-action" disabled={!isConnected} onClick={() => sendLeafCommand("B")} type="button">
              Show Green Leaf
            </button>
          </div>

          <label className="field-label" htmlFor="homepage-display-text">
            LED display text
          </label>
          <input
            className="text-input"
            id="homepage-display-text"
            onChange={(event) => setDisplayText(event.target.value)}
            value={displayText}
          />
          <div className="connection-actions">
            <button className="primary-action" disabled={!isConnected} onClick={() => showDisplayText(displayText)} type="button">
              Show Text on LED
            </button>
            <button className="secondary-action" disabled={!isConnected} onClick={showTemperature} type="button">
              Show Temperature
            </button>
            <button className="secondary-action" disabled={!isConnected} onClick={showLightLevel} type="button">
              Show Light
            </button>
          </div>

          <div className="connection-actions">
            <button className="secondary-action" disabled={!isConnected} onClick={showTime} type="button">
              Show Time
            </button>
            <button className="secondary-action" disabled={!isConnected} onClick={showDate} type="button">
              Show Date
            </button>
          </div>

          <label className="field-label" htmlFor="homepage-raw-command">
            Raw USB command
          </label>
          <textarea
            className="text-area"
            id="homepage-raw-command"
            onChange={(event) => setRawCommand(event.target.value)}
            rows={3}
            value={rawCommand}
          />
          <div className="connection-actions">
            <button className="primary-action" disabled={!isConnected} onClick={handleSendRaw} type="button">
              Send Raw Command
            </button>
          </div>
        </section>

        <YoloBitScriptUploader />
      </div>
    </section>
  );
}
