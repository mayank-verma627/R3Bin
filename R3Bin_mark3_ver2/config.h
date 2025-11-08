#pragma once 
#include <Arduino.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define DEVICE_NAME "R3Bin"
#define MANUFACTURER "Fostride"

//======================= HARDWARE PIN DEFINITIONS =======================
// Servo pins - Changed from ADC2 pins to digital-only pins
#define servoBasePin 26      // Changed from 26 (ADC2 doesn't work with WiFi)
#define servoTiltPin 25      // Changed from 25 (ADC2 doesn't work with WiFi)

// Metal Sensor Pins - Using ADC1 pins only (work with WiFi)
   // ADC1_CH4 - OK
#define metalSensorPin2 32   // ADC1_CH5 - OK
#define metalSensorPin3 33   // ADC1_CH7 - Changed from GPIO3

// IR sensor pins - All ADC1 pins (compatible with WiFi)
#define IRSensorPin1 35      // ADC1_CH0 - Changed from 35
#define IRSensorPin2 34      // ADC1_CH3 - Changed from 34
#define IRSensorPin3 36     // ADC1_CH6 - Changed from 39
#define IRSensorPin4 39      // ADC1_CH7 - Changed from 36
#define IRSensorPin5 23      // ADC1_CH4 - Changed from 23 (digital)
#define IRSensorPin6 19      // ADC1_CH5 - Changed from 19 (digital)

// Communication Pins
#define RPISerialRX 16
#define RPISerialTX 17
#define SerialBaudRate 115200

// Status LED - Changed to avoid boot pin
#define statusLED 2          // Changed from GPIO0 (boot pin)

//========================================================================
//======================= SERVO CONFIGURATION =======================
// Base Servo Angles 
#define servoBaseHome 45
#define servoBaseRotate 135

// Tilt Servo Angles
#define servoTiltHome 90
#define servoTiltForward 50
#define servoTiltBackward 130

// Servo Motion Parameters
#define servoStepSize 2
#define servoStepDelayMS 0
#define servoPauseDelayMS 500
extern int currentBaseAngle;

//========================================================================
//============Bin Numbers=================================================
const int plasticBin = 1;
const int paperBin = 2;
const int metalBin = 3;
const int misBin = 4;

//========================================================================
//================ Sensor Function Declaration ===========================
void initSensors();
bool isObjectDetected();
int binFillStatus(int binNumber);
bool isMetalDetected();

//========================================================================
//============================== Rpi Functions ===========================
void initRpi();
void sendInt(int value);
int receiveInt();
int toConvert(int a);
int sendAndReceiveInt(int val);
void checkKeyboardInput();

//========================================================================
//================ Mechanism Function Declaration ===========================
void initMechanism();
void reachDestination(int destination);
void servoRotate(Servo &servo, int startAngle, int endAngle);

//========================================================================
//===========================Online Update====================================
extern const char* Version;  // ADD THIS LINE
extern unsigned long lastUpdate;
extern int plasticBinFillLevel;
extern int paperBinFillLevel;
extern int metalBinFillLevel;
extern int misBinFillLevel;
extern const char* binStatus;
extern const char* errorCode;
extern int response;
void connectToWiFi();
void sendBinData();
//============================================================================
