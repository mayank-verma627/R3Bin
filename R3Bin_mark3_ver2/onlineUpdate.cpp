#include "config.h"

const char* ssid = "Esp32";
const char* password = "mayank@627";
const char* SUPABASE_URL = "https://wyacdsybudwpmqcwybey.supabase.co/rest/v1/bin_daily_data";
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YWNkc3lidWR3cG1xY3d5YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg2NDU5OSwiZXhwIjoyMDczNDQwNTk5fQ.VaJrHbwC2VrvDp4YkmPgPQ4jWrV4kGHHfRHUWtrBFng";

const char* binId = "BIN-001";
const char* Version = "v1.2.1 - 11012025"; //solved the bug for the onnline update

const char* bins [] = {"None", "Plastics", "Paper", "Metal", "Mis"};

void connectToWiFi() {
  Serial.print(F("Connecting to WiFi..."));
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\nConnected!"));
    Serial.print(F("IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\nFailed to connect to WiFi"));
  }
}

void sendBinData() {
  if (millis() - lastUpdate > 60000) {
    if (response < 1) {
      response = 0;
    }
    String lastDetected = bins[response - 1];
    plasticBinFillLevel = binFillStatus(IRSensorPin3);
    paperBinFillLevel = binFillStatus(IRSensorPin4);
    metalBinFillLevel = binFillStatus(IRSensorPin5);
    misBinFillLevel = binFillStatus(IRSensorPin6);
    binStatus = "Active";
    errorCode = "None";

    StaticJsonDocument<256> doc;
    doc["BinId"] = binId;
    doc["BinVersion"] = Version;
    doc["BinStatus"] = binStatus;
    doc["SubBin1"] = plasticBinFillLevel;
    doc["SubBin2"] = paperBinFillLevel;
    doc["SubBin3"] = metalBinFillLevel;
    doc["SubBin4"] = misBinFillLevel;
    doc["ErrorCodes"] = errorCode;
    doc["LastDetected"] = lastDetected;

    String jsonString;
    serializeJson(doc, jsonString);

    Serial.println(F("\n--- SENDING TO SUPABASE ---"));
    Serial.print(F("BinId: ")); Serial.println(binId);
    Serial.print(F("Status: ")); Serial.println(binStatus);
    Serial.print(F("SubBins: "));
    Serial.print(plasticBinFillLevel); Serial.print(F("%, "));
    Serial.print(paperBinFillLevel); Serial.print(F("%, "));
    Serial.print(metalBinFillLevel); Serial.print(F("%, "));
    Serial.print(misBinFillLevel); Serial.println(F("%"));
    Serial.print(lastDetected); Serial.println(F("%"));
    Serial.print(F("Error: ")); Serial.println(errorCode);
    Serial.print(F("JSON: ")); Serial.println(jsonString);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;

      // Use POST with upsert (on_conflict parameter)
      String url = String(SUPABASE_URL) + "?on_conflict=BinId";
      Serial.print(F("URL: ")); Serial.println(url);

      http.begin(url);
      http.addHeader(F("Content-Type"), F("application/json"));
      http.addHeader(F("apikey"), SUPABASE_KEY);
      http.addHeader(F("Authorization"), String(F("Bearer ")) + SUPABASE_KEY);
      http.addHeader(F("Prefer"), F("resolution=merge-duplicates,return=representation"));

      int httpResponseCode = http.POST(jsonString);

      Serial.print(F("Response Code: "));
      Serial.println(httpResponseCode);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.print(F("Response: "));
        Serial.println(response);
      }

      if (httpResponseCode == 201 || httpResponseCode == 200) {
        Serial.println(F("✓ Upsert Success!"));
        //checkSupabase(false);
      } else {
        Serial.println(F("✗ Upsert Failed!"));
        //checkSupabase(true);
      }

      http.end();
    } else {
      Serial.println(F("✗ WiFi Disconnected!"));
    }

    Serial.println(F("---------------------------\n"));
    lastUpdate = millis();
  }
}
