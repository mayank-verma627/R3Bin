#include "config.h"

#define VERSION_URL "https://raw.githubusercontent.com/mayank-verma627/R3Bin/refs/heads/main/R3Bin_mark3_ver2/Version.txt"
#define FIRMWARE_URL "https://raw.githubusercontent.com/mayank-verma627/R3Bin/main/R3Bin_mark3_ver2/R3Bin_mark3_ver2.ino.esp32da.bin"
String currentVersion = "v2.2.1 - 11012025";

void otaCheck(){
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
