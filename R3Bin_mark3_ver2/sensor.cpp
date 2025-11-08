#include "config.h"

void initSensors() {
  // Configure all IR sensor pins as INPUT
  pinMode(IRSensorPin1, INPUT);
  pinMode(IRSensorPin2, INPUT);
  pinMode(IRSensorPin3, INPUT);
  pinMode(IRSensorPin4, INPUT);
  pinMode(IRSensorPin5, INPUT);
  pinMode(IRSensorPin6, INPUT);
  
  // Configure metal sensor pins as INPUT

  pinMode(metalSensorPin2, INPUT);
  pinMode(metalSensorPin3, INPUT);
  
  // Configure status LED
  pinMode(statusLED, OUTPUT);
  digitalWrite(statusLED, HIGH);
  
  Serial.println("All Sensors initialized");
}

bool isObjectDetected() {
  int sensor1 = digitalRead(IRSensorPin1);
  int sensor2 = digitalRead(IRSensorPin2);
  
  // Object detected when sensor reads LOW (most IR sensors are active LOW)
  if(sensor1 == LOW || sensor2 == LOW){
    Serial.print("IR1: "); Serial.print(sensor1);
    Serial.print(" | IR2: "); Serial.println(sensor2);
    return true;
  }
  return false;
}

int binFillStatus(int binNumber) {
  int reading = digitalRead(binNumber);
  
  // When object is detected (sensor reads LOW), return 100
  // When no object (sensor reads HIGH), return 0
  if(reading == LOW) {
    return 100;  // Bin full (object detected)
  } else {
    return 0;    // Bin empty (no object detected)
  }
}

bool isMetalDetected() {
  int metal2 = digitalRead(metalSensorPin2);
  int metal3 = digitalRead(metalSensorPin3);
  
  // Metal detected when any sensor reads HIGH (most metal sensors are active HIGH)
  if( metal2 == HIGH || metal3 == HIGH) {
    Serial.println("Metal detected!");
    return true;
  }
  return false; 
}
