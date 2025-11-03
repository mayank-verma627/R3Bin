#include "config.h"
// Define the global variables here
unsigned long lastUpdate = 0;
int plasticBinFillLevel = 0;
int paperBinFillLevel = 0;
int metalBinFillLevel = 0;
int misBinFillLevel = 0;
const char* binStatus = "Initializing";
const char* errorCode = "None";

int response=1;

void setup() {
  Serial.begin(115200);
  Serial.println("R3Bin Starting.....");
  
  // Initialize WiFi first
  connectToWiFi();
  otaCheck();
  // Initialize RPi communication
  initRpi();  
  // Initialize sensors and mechanism
  initSensors();
  initMechanism();
  
  Serial.println("R3Bin Ready");
}

void loop() {
  // Send bin data periodically
  sendBinData();
  sendInt(0);
  // Debug: Print sensor values
  Serial.print(analogRead(IRSensorPin1)); Serial.print(" || ");
  Serial.print(analogRead(IRSensorPin2)); Serial.print(" || ");
  Serial.print(analogRead(IRSensorPin3)); Serial.print(" || ");
  Serial.print(analogRead(IRSensorPin4)); Serial.print(" || ");
  Serial.print(analogRead(IRSensorPin5)); Serial.print(" || ");
  Serial.print(analogRead(IRSensorPin6));Serial.print(" || ");
  Serial.println(isMetalDetected());// FIXED: Changed print to println for new line
  
  if(isObjectDetected()==true){
    Serial.println("Object is Detected");
    delay(200);
    response = sendAndReceiveInt(1);
    delay(500);
    if(response != -1){
      if(isMetalDetected()){
        Serial.println("Metal detected, overriding to metal bin");
        response=metalBin;
        reachDestination(metalBin);
        sendInt(3);
      }
      else{
        Serial.print("Moving to bin: ");
        Serial.println(response);
        reachDestination(response);
      }
    }
    else{
      Serial.println("No response from RPi");
      response=misBin;
      reachDestination(response);
    }
    
    Serial.println("Waste deposited. Ready for next item.");
  }
  
  delay(100);  // Small delay to prevent Serial spam
}
