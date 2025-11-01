//=======================dependancies/=============================
#include <ESP32Servo.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Update.h>
//==================================================================

//=======================Sensor Pin Outs=============================
#define IR_SENSOR_PIN1 0
#define IR_SENSOR_PIN2 0

#define IR_SENSOR_PIN3 0
#define IR_SENSOR_PIN4 0
#define IR_SENSOR_PIN5 0
#define IR_SENSOR_PIN6 0

#define metalSensorPin1 0
#define metalSensorPin2 0
#define metalSensorPin3 0
//===================================================================

//=========================Rpi comm==================================
#define ESP32_RX2 16
#define ESP32_TX2 17
//===================================================================

//=======================Motor Controls==============================
#define servoBasePin 0
#define servoTiltPin 0

Servo servoBase;
Servo servoTilt;

const int baseBin1 = 45;
const int baseBin2 = 135;
const int baseBin3 = 45;
const int baseBin4 = 135;

const int tiltHome = 92;
const int tiltForward = 70;
const int tiltBackward = 110;

const int stepSize = 2;
const int stepDelay = 2;

int currentBaseAngle = baseBin1;

//===================================================================

//========================WI-FI======================================
const char* ssid = "Esp32";
const char* password = "mayank@627";
//===================================================================


//=========================MQTT=====================================
const char* mqtt_server = "7c3fb6661d89423d9c0bb8e473148d6b.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "R3Bin";
const char* mqtt_password = "R3Bin_fostride@627";
const char* publish_topic = "R3Bin/data";

static const char *root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
...
-----END CERTIFICATE-----
)EOF";

const String location = "Mumbai_ridll";
const int bin_number = 1;
const String deployDate = "20251015";
String binId = "R3Bin_" + location + "_" + String(bin_number) + "_" + deployDate;

WiFiClientSecure espClient;
PubSubClient client(espClient);
unsigned long lastSend = 0;
const long sendInterval = 10000; // 10 seconds

unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 10000; // try every 10 seconds
//==================================================================



void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, ESP32_RX2, ESP32_TX2);
  
  connectToWiFi();
  
  servoBase.attach(servoBasePin);
  servoTilt.attach(servoTiltPin);
  servoBase.write(currentBaseAngle);
  servoTilt.write(tiltHome);

  pinMode(IR_SENSOR_PIN1, INPUT);
  pinMode(IR_SENSOR_PIN2, INPUT);
  pinMode(IR_SENSOR_PIN3, INPUT);
  pinMode(IR_SENSOR_PIN4, INPUT);
  pinMode(IR_SENSOR_PIN5, INPUT);
  pinMode(IR_SENSOR_PIN6, INPUT);

  pinMode(metalSensorPin1, INPUT);
  pinMode(metalSensorPin2, INPUT);
  pinMode(metalSensorPin3, INPUT);

  espClient.setInsecure();

  client.setServer(mqtt_server, mqtt_port);
  
}

void loop() {
  // put your main code here, to run repeatedly:
  if(!client.connected()) handleMQTT();
  client.loop();
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.println(WiFi.localIP());
}




void handleMQTT() {
  // If already connected, keep the MQTT client alive
  if (client.connected()) {
    client.loop();
    return;
  }

  // Not connected, check if it's time to retry
  unsigned long now = millis();
  if (now - lastReconnectAttempt >= reconnectInterval) {
    lastReconnectAttempt = now;
    Serial.println("Attempting MQTT reconnection...");

    if (client.connect(binId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("✅ MQTT reconnected!");
      client.subscribe("R3Bin/commands"); // optional: subscribe again
    } else {
      Serial.print("⚠️ MQTT reconnect failed, rc=");
      Serial.println(client.state());
      // don't block, just try again later
    }
  }
}
