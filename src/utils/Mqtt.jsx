// mqttClient.js
import mqtt from 'mqtt';

let mqttClient = null;

/**
 * Connect to MQTT broker and subscribe to a device topic
 * @param {string} deviceName - Name of the device
 * @param {function} onMessage - Callback when message 'call api' is received
 */
export const connectToMQTT = (deviceName, onMessage) => {
  if (!deviceName || typeof onMessage !== 'function') return;

  const topic = `devices/${deviceName}/apicall`;

  if (!mqttClient) {
    mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
      protocolVersion: 4,      // MQTT v3.1.1
      reconnectPeriod: 1000,   // try reconnect every second
      connectTimeout: 4000,    // 4 sec timeout
    });
  }

  mqttClient.on('connect', () => {
    console.log('MQTT connected');
    mqttClient.subscribe(topic, (err) => {
      if (err) console.error('Subscribe error:', err);
    });
  });

  mqttClient.on('message', (incomingTopic, message) => {
    if (incomingTopic === topic && message.toString() === 'call api') {
      onMessage(); // trigger callback
    }
  });

  mqttClient.on('error', (err) => {
    console.error('MQTT error:', err);
  });

  mqttClient.on('close', () => {
    console.log('MQTT connection closed');
  });
};

/**
 * Disconnect MQTT client
 */
export const disconnectMQTT = () => {
  if (mqttClient) {
    mqttClient.end(true, () => console.log('MQTT disconnected'));
    mqttClient = null;
  }
};
