import React from "react";

const wiringRows = [
  {
    part: "Soil moisture sensor",
    pin: "pin1",
    note: "Analog input used by `pin1.read_analog()`.",
  },
  {
    part: "Light sensor",
    pin: "pin2",
    note: "Analog input used by `pin2.read_analog()`.",
  },
  {
    part: "Pump relay / pump driver",
    pin: "pin13",
    note: "Digital output used by `pin13.write_digital()`.",
  },
  {
    part: "DHT20 temperature + humidity",
    pin: "Default I2C bus",
    note: "Created by `DHT20()` through the Homebit3 library.",
  },
  {
    part: "LCD1602 display",
    pin: "Default I2C bus",
    note: "Created by `LCD1602()` through the Homebit3 library.",
  },
];

const setupSteps = [
  "Connect the YoloBit UNO to your computer by USB.",
  "Wire the soil sensor to pin1, the light sensor to pin2, and the pump relay control pin to pin13.",
  "Keep the DHT20 and LCD1602 on the default Homebit3 I2C connection used by the libraries.",
  "Open the OhStem web app, paste or upload the YoloBit program, and flash it to the board.",
  "Update the Wi-Fi name, password, and MQTT account in the device code before running it outside the classroom setup.",
  "Power the board and wait for it to join Wi-Fi and publish MQTT data.",
];

export function ConnectionGuide() {
  return (
    <section className="setup-guide">
      <div className="setup-guide-header">
        <p className="eyebrow">Hardware Setup</p>
        <h2>How to connect the YoloBit UNO</h2>
        <p>
          This guide matches the current sample code in the project. It shows which YoloBit pins are used and the
          order to bring the board online through OhStem.
        </p>
      </div>

      <div className="setup-grid">
        <article className="setup-card">
          <h3>Pin mapping</h3>
          <div className="wiring-table" role="table" aria-label="YoloBit wiring table">
            <div className="wiring-row wiring-head" role="row">
              <span role="columnheader">Module</span>
              <span role="columnheader">YoloBit side</span>
              <span role="columnheader">How it is used</span>
            </div>
            {wiringRows.map((row) => (
              <div className="wiring-row" role="row" key={row.part}>
                <span role="cell">{row.part}</span>
                <span role="cell">
                  <code>{row.pin}</code>
                </span>
                <span role="cell">{row.note}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="setup-card">
          <h3>Bring it online</h3>
          <ol className="setup-steps">
            {setupSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="setup-note">
            Note: the DHT20 and LCD1602 pin numbers are not explicitly set in the sample code. This homepage assumes
            they use the default Homebit3 I2C port provided by your wiring kit.
          </p>
        </article>
      </div>
    </section>
  );
}
