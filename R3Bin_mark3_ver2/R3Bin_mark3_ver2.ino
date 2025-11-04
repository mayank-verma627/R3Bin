#include "config.h"

// Define the global variables here
unsigned long lastUpdate = 0;
int plasticBinFillLevel = 0;
int paperBinFillLevel = 0;
int metalBinFillLevel = 0;
int misBinFillLevel = 0;
const char* binStatus = "Initializing";
const char* errorCode = "None";
int response = 1;

// FreeRTOS Task Handles
TaskHandle_t SensorTaskHandle;
TaskHandle_t UploadTaskHandle;

// Task for continuous sensor monitoring and object detection
void sensorTask(void * parameter) {
  for(;;) {
    // Send status to RPi
    sendInt(0);
    
    // Debug: Print sensor values (reduced frequency to avoid spam)
    static unsigned long lastPrint = 0;
    if(millis() - lastPrint > 100) {  // Print every 100ms instead of every loop
      Serial.print(analogRead(IRSensorPin1)); Serial.print(" || ");
      Serial.print(analogRead(IRSensorPin2)); Serial.print(" || ");
      Serial.print(analogRead(IRSensorPin3)); Serial.print(" || ");
      Serial.print(analogRead(IRSensorPin4)); Serial.print(" || ");
      Serial.print(analogRead(IRSensorPin5)); Serial.print(" || ");
      Serial.print(analogRead(IRSensorPin6)); Serial.print(" || ");
      Serial.println(isMetalDetected());
      lastPrint = millis();
    }
    
    // Check for object detection
    if(isObjectDetected() == true) {
      Serial.println("Object is Detected");
      vTaskDelay(200 / portTICK_PERIOD_MS);  // Non-blocking delay
      
      response = sendAndReceiveInt(1);
      vTaskDelay(500 / portTICK_PERIOD_MS);
      
      if(response != -1) {
        if(isMetalDetected()) {
          Serial.println("Metal detected, overriding to metal bin");
          response = metalBin;
          reachDestination(metalBin);
          sendInt(3);
        }
        else {
          Serial.print("Moving to bin: ");
          Serial.println(response);
          reachDestination(response);
        }
      }
      else {
        Serial.println("No response from RPi");
        response = misBin;
        reachDestination(response);
      }
      
      Serial.println("Waste deposited. Ready for next item.");
    }
    
    vTaskDelay(10 / portTICK_PERIOD_MS);  // Small delay to prevent CPU hogging
  }
}

// Task for periodic data upload to Supabase
void uploadTask(void * parameter) {
  for(;;) {
    // Call sendBinData which handles its own timing (60 second interval)
    sendBinData();
    
    // Check every 5 seconds if it's time to send
   // vTaskDelay(5000 / portTICK_PERIOD_MS);
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("R3Bin Starting.....");
  
  // Initialize WiFi first
  connectToWiFi();
  
  // Initialize RPi communication
  initRpi();  
  
  // Initialize sensors and mechanism
  initSensors();
  initMechanism();
  
  Serial.println("Creating FreeRTOS tasks...");
  
  // Create sensor task on Core 0 (high priority)
  xTaskCreatePinnedToCore(
    sensorTask,           // Task function
    "SensorTask",         // Task name
    10000,                // Stack size (bytes)
    NULL,                 // Parameters
    2,                    // Priority (higher = more important)
    &SensorTaskHandle,    // Task handle
    0                     // Core 0
  );
  
  // Create upload task on Core 1 (lower priority)
  xTaskCreatePinnedToCore(
    uploadTask,           // Task function
    "UploadTask",         // Task name
    10000,                // Stack size (bytes)
    NULL,                 // Parameters
    1,                    // Priority (lower than sensor task)
    &UploadTaskHandle,    // Task handle
    1                     // Core 1 (different core!)
  );
  
  Serial.println("R3Bin Ready - Running on dual cores!");
  Serial.println("Core 0: Sensor monitoring");
  Serial.println("Core 1: Data upload");
}

void loop() {
  // Main loop can be empty or used for other tasks
  // All work is done by FreeRTOS tasks
  vTaskDelay(1000 / portTICK_PERIOD_MS);
}
