# MMM-Z2MSensors

Shows live Zigbee2MQTT sensor/device data on your MagicMirror\u00b2, straight from your
existing Mosquitto broker \u2014 no bridge, no Home Assistant, no extra services.

## Install

```bash
cd ~/MagicMirror/modules
mkdir MMM-Z2MSensors
# copy MMM-Z2MSensors.js, node_helper.js, MMM-Z2MSensors.css, package.json into it
cd MMM-Z2MSensors
npm install
```

## Configure

Add a module block to `~/MagicMirror/config/config.js`:

```js
{
  module: "MMM-Z2MSensors",
  position: "top_right",
  config: {
    mqttServer: "mqtt://localhost:1883", // Mosquitto is on this same Pi
    // mqttUser: "user",
    // mqttPassword: "pass",
    staleAfterMinutes: 180, // grey out a row if no update for this long
    devices: [
      {
        topic: "zigbee2mqtt/Iroda_Temp",
        label: "Iroda",
        fields: ["temperature", "humidity", "battery"]
      }
      // add more devices here, e.g.:
      // { topic: "zigbee2mqtt/Kert_Talaj", label: "Kert", fields: ["soil_moisture", "battery"] }
      // { topic: "zigbee2mqtt/Konyha_Konnektor", label: "Konyha", fields: ["state", "power"] }
    ]
  }
}
```

`fields` is optional \u2014 leave it out and the module will show every field Zigbee2MQTT
publishes for that device (minus link quality). Setting it explicitly just controls
order and lets you hide things you don't care about.

## Restart MagicMirror

```bash
pm2 restart mm   # if you run it under pm2
# or
sudo systemctl restart magicmirror   # if you run it as a systemd service
```

New rows should appear as soon as Zigbee2MQTT publishes an update for each topic.
