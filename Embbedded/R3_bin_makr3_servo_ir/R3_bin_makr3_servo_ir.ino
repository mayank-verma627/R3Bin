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
#define VERSION_URL "https://raw.githubusercontent.com/mayank-verma627/fostride/refs/heads/master/esp32_codes/remote_firware_update/version.txt"
#define FIRMWARE_URL "https://raw.githubusercontent.com/mayank-verma627/fostride/master/esp32_codes/remote_firware_update/remote_firware_update.ino.esp32.bin"

#define led 23
#define val 100

String currentVersion = "1.0.5";  // Version in current firmware

// ================= Wi-Fi =================
const char* ssid = "Esp32";
const char* password = "mayank@627";

// ================= MQTT =================
const char* mqtt_server = "7c3fb6661d89423d9c0bb8e473148d6b.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "R3Bin";
const char* mqtt_password = "R3Bin_fostride@627";
const char* publish_topic = "R3Bin/data";

// ================= TLS Root CA =================
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

// ================= Bin Info =================
const String location = "Mumbai_ridll";
const int bin_number = 1;
const String deployDate = "20251015";
String binId = "R3Bin_" + location + "_" + String(bin_number) + "_" + deployDate;

// ================= MQTT Client =================
WiFiClientSecure espClient;
PubSubClient client(espClient);

// ================= Timer =================
unsigned long lastSend = 0;
const long sendInterval = 10000; // 10 seconds

// ================= Functions =================
void reconnect(){
  while(!client.connected()){
    Serial.print("Connecting to MQTT Broker...");
    if(client.connect(binId.c_str(), mqtt_username, mqtt_password)){
      Serial.println("Connected!");
    } else {
      Serial.print("Failed, rc=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void sendBinData(){
  StaticJsonDocument<256> doc; // increased size for extra fields

  doc["bin_id"] = binId;
  String jsonString;
  serializeJson(doc, jsonString);
  client.publish(publish_topic, jsonString.c_str());
  Serial.println("Published: " + jsonString);
}

// ================= Setup =================

//======================== Servo pins and objects===================
#define SERVO_BASE_PIN 12
#define SERVO_TILT_PIN 14

Servo servoBase;
Servo servoTilt;
//==================================================================

// ========================Metal sensor pins========================
#define METAL_SENSOR_PIN 15
#define METAL_SENSOR_PIN2 39
//==================================================================

//====================IR sensor pin=====================================
#define IR_SENSOR_PIN1 33
#define IR_SENSOR_PIN2 0
#define IR_SENSOR_PIN3 0

#define IR_SENSOR_PIN4 0
#define IR_SENSOR_PIN5 0
#define IR_SENSOR_PIN6 0
#define IR_SENSOR_PIN7 0
//=======================================================================

// Serial pins
#define ESP32_RX2 16
#define ESP32_TX2 17

// Servo angles
const int BASE_BIN1 = 45;
const int BASE_BIN2 = 135;
const int BASE_BIN3 = 45;  // bin3 doesn't rotate base
const int BASE_BIN4 = 135;

const int TILT_HOME = 92;
const int TILT_FORWARD = 70;
const int TILT_BACKWARD = 140;

// Smooth motion
const int STEP_SIZE = 2;
const int STEP_DELAY = 0;

// Track current base position
int currentBaseAngle = BASE_BIN1;

void setup() {
  Serial.begin(115200);
  connectToWiFi();
  
  if (checkForUpdate()) {
    Serial.println("New version found! Starting OTA...");
    if (performOTA()) {
      Serial.println("Update successful! Rebooting...");
      ESP.restart();
    } else {
      Serial.println("Update failed!");
    }
  } else {
    Serial.println("No update needed.");
  }

  pinMode(led, OUTPUT);
  Serial2.begin(115200, SERIAL_8N1, ESP32_RX2, ESP32_TX2);

  servoBase.attach(SERVO_BASE_PIN);
  servoTilt.attach(SERVO_TILT_PIN);

  servoBase.write(currentBaseAngle);
  servoTilt.write(TILT_HOME);

  pinMode(METAL_SENSOR_PIN, INPUT);
  pinMode(METAL_SENSOR_PIN2, INPUT);
  pinMode(IR_SENSOR_PIN1, INPUT);

  Serial.println("Bin Ready");

  Serial.println("R3Bin ESP32 starting...");

  // Wi-Fi connection
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());

  // TLS setup
  espClient.setCACert(root_ca);

  // MQTT setup
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  // Metal sensor trigger
  Serial.println("Bin Ready....Put Waste");

  // IR sensor trigger
  if (digitalRead(IR_SENSOR_PIN1) == LOW) {
    Serial.println("Object detected by IR sensor -> Sending 1 to Raspberry Pi");
    //delay(500);
    if (digitalRead(METAL_SENSOR_PIN) == HIGH || digitalRead(METAL_SENSOR_PIN2) == HIGH) {
    Serial.println("Metal detected -> Sending 3 to Raspberry Pi");
    Serial2.println(3); // notify RPi
    moveToBin(3);
    delay(500); 
    return;
  }
    Serial2.println(1); // notify RPi
    // Wait for RPi to respond with target bin
    while (Serial2.available() == 0);
    int received = Serial2.parseInt();
    int bin = convert(received);

    Serial.print("Received bin from RPi: ");
    Serial.println(bin);
    moveToBin(bin);
    delay(500);
  }

  if (checkForUpdate()) {
    Serial.println("New version found! Starting OTA...");
    if (performOTA()) {
      Serial.println("Update successful! Rebooting...");
      ESP.restart();
    } else {
      Serial.println("Update failed!");
    }
  } else {
    Serial.println("No update needed.");
  }
 
}

// Move to bin
void moveToBin(int bin) {
  int targetBase = currentBaseAngle;
  int targetTilt = TILT_HOME;

  switch(bin) {
    case 1:
      targetBase = BASE_BIN1;
      targetTilt = TILT_FORWARD;
      break;
    case 2:
      targetBase = BASE_BIN2;
      targetTilt = TILT_FORWARD;
      break;
    case 3:
      targetBase = BASE_BIN3;
      targetTilt = TILT_BACKWARD;
      break;
    case 4:
      targetBase = BASE_BIN4;
      targetTilt = TILT_BACKWARD;
      break;
    default:
      Serial.println("Invalid bin");
      return;
  }

  if (currentBaseAngle != targetBase) moveServoSmooth(servoBase, currentBaseAngle, targetBase);
  delay(500);
  moveServoSmooth(servoTilt, TILT_HOME, targetTilt);
  delay(500);
  moveServoSmooth(servoTilt, targetTilt, TILT_HOME);

  currentBaseAngle = targetBase;
}

// Smooth servo motion
void moveServoSmooth(Servo &servo, int startAngle, int endAngle) {
  if (startAngle < endAngle) {
    for (int a = startAngle; a <= endAngle; a += STEP_SIZE) {
      servo.write(a);
      delay(STEP_DELAY);
    }
  } else {
    for (int a = startAngle; a >= endAngle; a -= STEP_SIZE) {
      servo.write(a);
      delay(STEP_DELAY);
    }
  }
}

int convert(int a) { 
    return (a > 10) ? a % 10 : a; 
}


void connectToWiFi() {
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
}

bool checkForUpdate() {
  HTTPClient http;
  http.begin(VERSION_URL);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String newVersion = http.getString();
    newVersion.trim();
    Serial.println("Latest version: " + newVersion);
    if (newVersion != currentVersion) {
      return true;
    }
  } else {
    Serial.println("Version check failed, HTTP code: " + String(httpCode));
  }
  http.end();
  return false;
}

bool performOTA() {
  HTTPClient http;
  http.begin(FIRMWARE_URL);
  int httpCode = http.GET();

  if (httpCode == 200) {
    int contentLength = http.getSize();
    WiFiClient *client = http.getStreamPtr();

    if (contentLength > 0) {
      Serial.println("Content-Length: " + String(contentLength));
      if (!Update.begin(contentLength)) {
        Serial.println("Not enough space for OTA");
        return false;
      }
    } else {
      Serial.println("No Content-Length header, starting OTA with unknown size");
      if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
        Serial.println("Not enough space for OTA");
        return false;
      }
    }

    size_t written = Update.writeStream(*client);
    if (written > 0) {
      Serial.println("OTA written: " + String(written));
    } else {
      Serial.println("OTA write failed");
      return false;
    }

    if (Update.end()) {
      if (Update.isFinished()) {
        Serial.println("Update successful");
        return true;
      } else {
        Serial.println("Update not finished");
        return false;
      }
    } else {
      Serial.println("Update error: " + String(Update.getError()));
      return false;
    }
  } else {
    Serial.println("Firmware download failed, HTTP code: " + String(httpCode));
    return false;
  }
  http.end();
  return false;
}
