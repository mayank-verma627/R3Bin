#include "config.h"

const char* ssid = "Esp32";
const char* password = "mayank@627";
const char* SUPABASE_URL = "https://wyacdsybudwpmqcwybey.supabase.co/rest/v1/bin_daily_data";
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YWNkc3lidWR3cG1xY3d5YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg2NDU5OSwiZXhwIjoyMDczNDQwNTk5fQ.VaJrHbwC2VrvDp4YkmPgPQ4jWrV4kGHHfRHUWtrBFng";

const char* binId = "BIN-001";
const char* Version = "v1.2.0 - 10302025";


void connectToWiFi(){
  Serial.print(F("Connecting to WiFi..."));
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }
  
  if(WiFi.status() == WL_CONNECTED){
    Serial.println(F("\nConnected!"));
    Serial.print(F("IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\nFailed to connect to WiFi"));
  }
}

void sendBinData(){
  if(millis() - lastUpdate > 60000){  // FIXED: Correct order
    
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
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    if(WiFi.status() == WL_CONNECTED){
      HTTPClient http;
      http.begin(SUPABASE_URL);
      http.addHeader(F("Content-Type"), F("application/json"));
      http.addHeader(F("apikey"), SUPABASE_KEY);
      http.addHeader(F("Authorization"), String(F("Bearer ")) + SUPABASE_KEY);
      http.addHeader(F("Prefer"), F("return=minimal"));
      
      int httpResponseCode = http.POST(jsonString);
      
      if (httpResponseCode == 201 || httpResponseCode == 200) {
        Serial.println(F("✓ Data sent successfully!"));
        lastUpdate = millis();  // ADDED: Update the timestamp
      } else {
        Serial.print(F("✗ Failed! Code: "));
        Serial.println(httpResponseCode);
        if (httpResponseCode > 0) {
          Serial.println(http.getString());
        }
      }
      
      http.end();
    } else {
      Serial.println(F("WiFi not connected. Skipping data send."));
    }
    lastUpdate = millis();
  }
}
