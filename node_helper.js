const NodeHelper = require("node_helper");
const mqtt = require("mqtt");

module.exports = NodeHelper.create({
  start: function () {
    this.client = null;
    this.started = false;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "Z2M_CONFIG" && !this.started) {
      this.started = true;
      this.config = payload;
      this.connect();
    }
  },

  connect: function () {
    const url = this.config.mqttServer || "mqtt://localhost:1883";
    const options = { reconnectPeriod: 5000 };
    if (this.config.mqttUser) options.username = this.config.mqttUser;
    if (this.config.mqttPassword) options.password = this.config.mqttPassword;

    console.log("[MMM-Z2MSensors] connecting to " + url);
    this.client = mqtt.connect(url, options);

    this.client.on("connect", () => {
      console.log("[MMM-Z2MSensors] connected to broker");
      this.sendSocketNotification("Z2M_STATUS", "connected");
      (this.config.devices || []).forEach((d) => {
        this.client.subscribe(d.topic, (err) => {
          if (err) console.error("[MMM-Z2MSensors] subscribe failed for " + d.topic, err.message);
        });
      });
    });

    this.client.on("message", (topic, message) => {
      let payload;
      try {
        payload = JSON.parse(message.toString());
      } catch (e) {
        return; // ignore non-JSON payloads (e.g. availability topics)
      }
      if (typeof payload !== "object" || payload === null) return;
      this.sendSocketNotification("Z2M_UPDATE", { topic, payload });
    });

    this.client.on("error", (err) => {
      console.error("[MMM-Z2MSensors] MQTT error:", err.message);
      this.sendSocketNotification("Z2M_STATUS", "error");
    });

    this.client.on("reconnect", () => {
      console.log("[MMM-Z2MSensors] reconnecting to broker\u2026");
    });
  }
});
