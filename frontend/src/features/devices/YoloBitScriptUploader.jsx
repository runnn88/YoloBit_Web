import React, { useState } from "react";
import { useYoloBitUsb } from "../connection/YoloBitUsbContext";
import {
  LIBRARY_FREE_USB_ECHO_PRESET,
  SAMPLE_BASED_CONTROLLER_PRESET,
} from "./yolobitScriptPresets";

export function YoloBitScriptUploader() {
  const [scriptText, setScriptText] = useState(LIBRARY_FREE_USB_ECHO_PRESET);
  const { isConnected, sendSoftReset, uploadScriptAsMain } = useYoloBitUsb();

  async function handleUpload() {
    await uploadScriptAsMain(scriptText);
  }

  return (
    <section className="setup-card">
      <h3>Load Controller to YoloBit</h3>
      <p>
        Upload a MicroPython controller directly to the board as <code>main.py</code>. Use the library-free preset if
        the board does not have YoloBit helper libraries yet.
      </p>

      <div className="connection-actions">
        <button
          className="secondary-action"
          onClick={() => setScriptText(LIBRARY_FREE_USB_ECHO_PRESET)}
          type="button"
        >
          Use Library-Free Preset
        </button>
        <button
          className="secondary-action"
          onClick={() => setScriptText(SAMPLE_BASED_CONTROLLER_PRESET)}
          type="button"
        >
          Use Sample-Based Preset
        </button>
      </div>

      <label className="field-label" htmlFor="yolobit-script-text">
        main.py contents
      </label>
      <textarea
        className="text-area text-area-large"
        id="yolobit-script-text"
        onChange={(event) => setScriptText(event.target.value)}
        rows={16}
        value={scriptText}
      />

      <div className="connection-actions">
        <button className="primary-action" disabled={!isConnected} onClick={handleUpload} type="button">
          Upload as main.py
        </button>
        <button className="secondary-action" disabled={!isConnected} onClick={sendSoftReset} type="button">
          Soft Reset Board
        </button>
      </div>
    </section>
  );
}
