#pragma once 
#include <Arduino.h>
#include <ESP32Servo.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
//#include <Update.h>

#define DEVICE_NAME "R3Bin"
#define MANUFACTURER "Fostride"
//======================= HARDWARE PIN DEFINITIONS =======================
//Servo pins
#define servoBasePin 26
#define servoTiltPin 25
//Metal Sensor Pin
#define metalSensorPin1 25
#define metalSensorPin2 32
#define metalSensorPin3 33
//IR sensor pins 
#define IRSensorPin1 35
#define IRSensorPin2 34
#define IRSensorPin3 39
#define IRSensorPin4 36
#define IRSensorPin5 23
#define IRSensorPin6 19
//Communication Pins
#define RPISerialRX 16
#define RPISerialTX 17
#define SerialBaudRate 115200
//Status Led 
#define statusLED 0
//========================================================================
//======================= SERVO CONFIGURATION =======================
//Base Servo Angles 
#define servoBaseHome 45
#define servoBaseRotate 135
//Tilt Servo Angles
#define servoTiltHome 90
#define servoTiltForward 50
#define servoTiltBackward 130
//Servo Motion Parameters
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
int receiveInt();  // FIXED: Typo
int toConvert(int a);
int sendAndReceiveInt(int val);
//========================================================================
//================ Mechanism Function Declaration ===========================
void initMechanism();
void reachDestination(int destination);
void servoRotate(Servo &servo, int startAngle, int endAngle);
//========================================================================
//===========================Online Update====================================
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

//===========================OTA Update====================================
//void otaCheck();
//bool checkForUpdate();
//bool performOTA();
//============================================================================
