#include "config.h"

// Define threshold value (adjust based on your sensor readings)
#define IR_THRESHOLD 4000  // Adjust this value based on your serial monitor readings

void initSensors() {
  // Analog pins don't need pinMode for analogRead
  pinMode(metalSensorPin1, INPUT);
  pinMode(metalSensorPin2, INPUT);
  pinMode(metalSensorPin3, INPUT);
  pinMode(statusLED, OUTPUT);
  digitalWrite(statusLED, HIGH);
  Serial.println("All Sensors initialized");
}

bool isObjectDetected() {
  int sensor1 = analogRead(IRSensorPin1);
  int sensor2 = analogRead(IRSensorPin2);
  
  // Object detected when value is BELOW threshold
  // (analog IR sensors typically output LOW voltage when object is detected)
  if(sensor1 < IR_THRESHOLD || sensor2 < IR_THRESHOLD){
    Serial.print("IR1: "); Serial.print(sensor1);
    Serial.print(" | IR2: "); Serial.println(sensor2);
    return true;
  }
  return false;
}

int binFillStatus(int binNumber) {
  int reading = analogRead(binNumber);
  return map(reading, 0, 4095, 100, 0);  // 0-4095 maps to 100-0% (inverted for fill level)
}

bool isMetalDetected() {
  return (digitalRead(metalSensorPin1) == HIGH ||
          digitalRead(metalSensorPin2) == HIGH ||
          digitalRead(metalSensorPin3) == HIGH);
}
