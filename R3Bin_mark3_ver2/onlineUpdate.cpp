#include "config.h"

const char* ssid = "Esp32";
const char* password = "mayank@627";
const char* SUPABASE_URL = "https://wyacdsybudwpmqcwybey.supabase.co/rest/v1/bin_daily_data?on_conflict=BinId";
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YWNkc3lidWR3cG1xY3d5YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg2NDU5OSwiZXhwIjoyMDczNDQwNTk5fQ.VaJrHbwC2VrvDp4YkmPgPQ4jWrV4kGHHfRHUWtrBFng";

const char* binId = "BIN-001";
const char* Version = "v1.3.0 - FreeRTOS"; // Updated version

const int send_to_supa_time=10000;
const char* bins[] = {"None", "Plastics", "Paper", "Metal", "Mis"};

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
  // Check if enough time has passed (60 seconds)
  if (millis() - lastUpdate < send_to_supa_time) {
    return;  // Exit early if not time yet
  }
  
  Serial.println(F("\n[UPLOAD] Starting data upload..."));
  
  // Prepare data
  if (response < 1) {
    response = 4;
  }
  String lastDetected = bins[response];
  
  plasticBinFillLevel = binFillStatus(IRSensorPin3);
  paperBinFillLevel = binFillStatus(IRSensorPin4);
  metalBinFillLevel = binFillStatus(IRSensorPin5);
  misBinFillLevel = binFillStatus(IRSensorPin6);
  binStatus = "NonOperational";
  errorCode = "None";

  // Create JSON document
  StaticJsonDocument<256> doc;
  doc["BinId"] = binId;
  doc["BinVersion"] = Version;
  doc["BinStatus"] = "Opera";
  doc["SubBin1"] = plasticBinFillLevel;
  doc["SubBin2"] = paperBinFillLevel;
  doc["SubBin3"] = metalBinFillLevel;
  doc["SubBin4"] = misBinFillLevel;
  doc["ErrorCodes"] = errorCode;
  doc["LastDetected"] = lastDetected;

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.println(F("--- DATA TO SEND ---"));
  Serial.print(F("BinId: ")); Serial.println(binId);
  Serial.print(F("Status: ")); Serial.println(binStatus);
  Serial.print(F("SubBins: "));
  Serial.print(plasticBinFillLevel); Serial.print(F("%, "));
  Serial.print(paperBinFillLevel); Serial.print(F("%, "));
  Serial.print(metalBinFillLevel); Serial.print(F("%, "));
  Serial.print(misBinFillLevel); Serial.println(F("%"));
  Serial.print(F("Last Detected: ")); Serial.println(lastDetected);
  Serial.print(F("JSON: ")); Serial.println(jsonString);
  delay(3000);
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[ERROR] WiFi Disconnected! Skipping upload."));
    lastUpdate = millis();  // Update timer to avoid rapid retries
    return;
  }

  HTTPClient http;
  
  // IMPORTANT: Set timeouts to prevent blocking
  http.setTimeout(5000);          // 5 second timeout for entire request
  http.setConnectTimeout(3000);   // 3 second connection timeout

  // Construct URL with upsert parameter
  String url = String(SUPABASE_URL) ;
  
  Serial.print(F("[HTTP] Connecting to: ")); Serial.println(url);
  delay(3000);
  http.begin(url);
  http.addHeader(F("Content-Type"), F("application/json"));
  http.addHeader(F("apikey"), SUPABASE_KEY);
  http.addHeader(F("Authorization"), String(F("Bearer ")) + SUPABASE_KEY);
  http.addHeader(F("Prefer"), F("resolution=merge-duplicates,return=representation"));

  unsigned long uploadStart = millis();
  int httpResponseCode = http.POST(jsonString);
  unsigned long uploadTime = millis() - uploadStart;
  delay(3000);
  Serial.print(F("[HTTP] Response Code: "));
  Serial.println(httpResponseCode);
  Serial.print(F("[HTTP] Upload took: "));
  Serial.print(uploadTime);
  Serial.println(F(" ms"));

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print(F("[HTTP] Response: "));
    Serial.println(response);
    
    if (httpResponseCode == 201 || httpResponseCode == 200) {
      Serial.println(F("[SUCCESS] ✓ Data uploaded successfully!"));
    } else {
      Serial.println(F("[ERROR] ✗ Upload failed!"));
    }
  } else {
    Serial.print(F("[ERROR] HTTP POST failed: "));
    Serial.println(http.errorToString(httpResponseCode));
    delay(3000);
  }

  http.end();
  Serial.println(F("--- UPLOAD COMPLETE ---\n"));
  delay(3000);
  // Update the last upload timestamp
  lastUpdate = millis();
}
