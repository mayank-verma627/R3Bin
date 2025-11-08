#include "config.h"

int in=0;

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
    sendInt(0);
    
    static unsigned long lastPrint = 0;
    if(millis() - lastPrint > 1000) {  // Print every 1 second for better readability
      // Update all bin fill levels
      plasticBinFillLevel = binFillStatus(IRSensorPin3);
      paperBinFillLevel = binFillStatus(IRSensorPin4);
      metalBinFillLevel = binFillStatus(IRSensorPin5);
      misBinFillLevel = binFillStatus(IRSensorPin6);
      
      // Display bin status
      Serial.println("\n========== BIN STATUS ==========");
      Serial.print("Plastic Bin:  "); 
      Serial.print(plasticBinFillLevel); 
      Serial.println(plasticBinFillLevel == 100 ? "% [FULL]" : "% [EMPTY]");
      
      Serial.print("Paper Bin:    "); 
      Serial.print(paperBinFillLevel); 
      Serial.println(paperBinFillLevel == 100 ? "% [FULL]" : "% [EMPTY]");
      
      Serial.print("Metal Bin:    "); 
      Serial.print(metalBinFillLevel); 
      Serial.println(metalBinFillLevel == 100 ? "% [FULL]" : "% [EMPTY]");
      
      Serial.print("Misc Bin:     "); 
      Serial.print(misBinFillLevel); 
      Serial.println(misBinFillLevel == 100 ? "% [FULL]" : "% [EMPTY]");
      
      // Display object detection sensors
      Serial.println("\n--- Detection Sensors ---");
      Serial.print("IR Sensor 1: "); 
      Serial.println(digitalRead(IRSensorPin1) == LOW ? "OBJECT DETECTED" : "Clear");
      Serial.print("IR Sensor 2: "); 
      Serial.println(digitalRead(IRSensorPin2) == LOW ? "OBJECT DETECTED" : "Clear");
      
      // Display metal detection
      Serial.print("Metal Detect: "); 
      Serial.println(isMetalDetected() ? "YES" : "NO");
      Serial.println("================================\n");
      
      lastPrint = millis();
    }
    
    // Check for object detection
    if(isObjectDetected() == true) {
      Serial.println("\n!!! OBJECT DETECTED !!!\n");
      
      // METAL DETECTION PRIORITY: Check for metal for approximately 1 second
      bool metalDetected = false;
      unsigned long metalCheckStart = millis();
      const unsigned long METAL_CHECK_DURATION = 1000;  // 1 second
      
      Serial.println("Checking for metal for 1 second...");
      while(millis() - metalCheckStart < METAL_CHECK_DURATION) {
        if(isMetalDetected()) {
          metalDetected = true;
          Serial.println("✓ Metal detected!");
          break;  // Exit early if metal is found
        }
        vTaskDelay(50 / portTICK_PERIOD_MS);  // Check every 50ms
      }
      
      if(metalDetected) {
        // Metal was detected - handle metal bin routing with handshake
        Serial.println("Metal confirmed - initiating handshake with RPi");
        
        // Send metal detection signal to RPi (code 3) and wait for acknowledgment
        int rpiResponse = sendAndReceiveInt(3);
        Serial.println("Metal detection signal (3) sent to RPi");
        
        // Wait for RPi to send back acknowledgment (expecting 3)
        if(rpiResponse == 3) {
          Serial.println("✓ RPi acknowledged metal detection (received 3)");
          
          // Give RPi additional time to process
          vTaskDelay(500 / portTICK_PERIOD_MS);
          
          // Now move to metal bin
          Serial.println("→ Moving to metal bin");
          reachDestination(metalBin);
          
          // Wait for deposit to complete
          vTaskDelay(500 / portTICK_PERIOD_MS);
          
          Serial.println("✓ Metal waste deposited successfully.");
          response = metalBin;  // Update response for upload task
        }
        else {
          // RPi didn't acknowledge properly
          Serial.print("⚠ Warning: Expected 3 from RPi, received: ");
          Serial.println(rpiResponse);
          Serial.println("Proceeding to metal bin anyway");
          
          // Still move to metal bin for safety
          reachDestination(metalBin);
          vTaskDelay(500 / portTICK_PERIOD_MS);
          response = metalBin;  // Update response for upload task
        }
      }
      else {
        // No metal detected after 1 second - proceed with RPi classification
        Serial.println("No metal detected - requesting RPi classification");
        
        // Request classification from RPi (code 1)
        response = sendAndReceiveInt(1);        
        if(response != -1 && response >= 1 && response <= 4) {
          // Valid response received
          Serial.print("✓ RPi classified waste - moving to bin: ");
          Serial.println(response);
          reachDestination(response);
          
          // Give RPi time to process before next cycle
          vTaskDelay(500 / portTICK_PERIOD_MS);
        }
        else {
          // No valid response from RPi - route to miscellaneous bin
          Serial.println("⚠ No valid response from RPi - routing to miscellaneous bin");
          response = misBin;
          reachDestination(response);
         }
      }
      
      Serial.println("✓ Waste deposited. Ready for next item.\n");
      
      // Additional delay before accepting next object to ensure RPi is ready
    }
    
    vTaskDelay(100 / portTICK_PERIOD_MS);  // Small delay to prevent CPU hogging
  }
}

  
// Task for periodic data upload to Supabase
void uploadTask(void * parameter) {
  for(;;) {
    // Call sendBinData which handles its own timing
    sendBinData();
    
    // Yield to prevent watchdog timeout
    vTaskDelay(1000 / portTICK_PERIOD_MS);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);  // Give serial time to initialize
  
  Serial.println("\n\n");
  Serial.println("================================");
  Serial.println("    R3Bin Starting.....");
  Serial.println("    Version: " + String(Version));
  Serial.println("================================\n");
  
  // Initialize WiFi first
  connectToWiFi();
  
  // Initialize RPi communication
  initRpi();  
  
  // Initialize sensors and mechanism
  initSensors();
  initMechanism();
  
  Serial.println("\n[SETUP] Creating FreeRTOS tasks...");
  
  // Create sensor task on Core 0 (high priority)
  xTaskCreatePinnedToCore(
    sensorTask,
    "SensorTask",
    10000,
    NULL,
    2,                    // Highest priority
    &SensorTaskHandle,
    0                     // Core 0
  );
  
  // Create upload task on Core 1 (lower priority)
  xTaskCreatePinnedToCore(
    uploadTask,
    "UploadTask",
    16384,                // Larger stack for HTTP
    NULL,
    1,
    &UploadTaskHandle,
    1                     // Core 1
  );
  
  Serial.println("\n================================");
  Serial.println("✓ R3Bin Ready - Running on dual cores!");
  Serial.println("  Core 0: Sensor monitoring");
  Serial.println("  Core 1: Data upload");
  Serial.println("================================\n");
}

void loop() {
  // Main loop yields to prevent watchdog
  vTaskDelay(1000 / portTICK_PERIOD_MS);
}
