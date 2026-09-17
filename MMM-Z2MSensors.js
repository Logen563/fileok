/* MMM-Z2MSensors
 * Displays live Zigbee2MQTT sensor/device data on the MagicMirror.
 * Connects to your existing Mosquitto broker via the node_helper (plain MQTT, no websockets needed).
 */

Module.register("MMM-Z2MSensors", {
  defaults: {
    mqttServer: "mqtt://localhost:1883",
    mqttUser: null,
    mqttPassword: null,
    updateFadeSpeed: 500,
    staleAfterMinutes: 180, // grey out a device if nothing heard for this long
    devices: [
      // Example:
      // { topic: "zigbee2mqtt/Iroda_Temp", label: "Iroda", fields: ["temperature", "humidity", "battery"] }
    ]
  },

  requiresVersion: "2.1.0",

  start: function () {
    this.state = {};     // topic -> latest payload
    this.lastSeen = {};  // topic -> timestamp
    this.loaded = false;
    this.sendSocketNotification("Z2M_CONFIG", this.config);
  },

  getStyles: function () {
    return ["MMM-Z2MSensors.css"];
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "Z2M_UPDATE") {
      this.state[payload.topic] = payload.payload;
      this.lastSeen[payload.topic] = Date.now();
      this.loaded = true;
      this.updateDom(this.config.updateFadeSpeed);
    }
    if (notification === "Z2M_STATUS") {
      this.connectionStatus = payload; // "connected" | "error"
      this.updateDom(this.config.updateFadeSpeed);
    }
  },

  getFieldIcon: function (key) {
    const icons = {
      temperature: "fa-thermometer-half",
      humidity: "fa-tint",
      soil_moisture: "fa-seedling",
      moisture: "fa-seedling",
      battery: "fa-battery-half",
      power: "fa-bolt",
      energy: "fa-plug",
      voltage: "fa-flash",
      current: "fa-flash",
      state: "fa-power-off",
      linkquality: "fa-wifi",
      contact: "fa-door-open",
      occupancy: "fa-walking",
      illuminance: "fa-sun-o",
      water_leak: "fa-tint",
      co2: "fa-cloud"
    };
    return icons[key] || "fa-circle";
  },

  formatField: function (key, val) {
    const units = {
      temperature: "\u00B0C", humidity: "%", soil_moisture: "%", moisture: "%",
      battery: "%", power: "W", energy: "kWh", voltage: "V", current: "A",
      illuminance: "lx", co2: "ppm"
    };
    if (typeof val === "boolean") return val ? "ON" : "OFF";
    if (typeof val === "number") {
      const rounded = Number.isInteger(val) ? val : Math.round(val * 10) / 10;
      return rounded + (units[key] || "");
    }
    return String(val);
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.className = "z2m-wrapper";

    if (!this.config.devices || this.config.devices.length === 0) {
      wrapper.className = "dimmed light small";
      wrapper.innerHTML = "MMM-Z2MSensors: no devices configured.";
      return wrapper;
    }

    if (!this.loaded) {
      wrapper.className = "dimmed light small";
      wrapper.innerHTML = "Waiting for Zigbee2MQTT data\u2026";
      return wrapper;
    }

    this.config.devices.forEach((device) => {
      const payload = this.state[device.topic];
      const seenAt = this.lastSeen[device.topic];
      const isStale = seenAt && (Date.now() - seenAt) > this.config.staleAfterMinutes * 60 * 1000;

      const row = document.createElement("div");
      row.className = "z2m-row" + (isStale ? " z2m-stale" : "");

      const label = document.createElement("span");
      label.className = "z2m-label";
      label.innerHTML = device.label || device.topic;
      row.appendChild(label);

      const values = document.createElement("span");
      values.className = "z2m-values";

      if (!payload) {
        values.innerHTML = "<span class='z2m-waiting'>\u2014</span>";
      } else {
        const fields = device.fields || Object.keys(payload).filter((k) => k !== "linkquality");
        values.innerHTML = fields
          .filter((f) => payload[f] !== undefined)
          .map((f) => `<span class="z2m-field"><i class="fa ${this.getFieldIcon(f)}"></i> ${this.formatField(f, payload[f])}</span>`)
          .join("");
      }
      row.appendChild(values);
      wrapper.appendChild(row);
    });

    return wrapper;
  }
});
