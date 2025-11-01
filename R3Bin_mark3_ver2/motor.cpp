#include "config.h"

Servo servoBase;
Servo servoTilt;
int currentBaseAngle = servoBaseHome;

void initMechanism(){
  servoBase.attach(servoBasePin);
  servoTilt.attach(servoTiltPin);
  
  servoBase.write(servoBaseHome);
  servoTilt.write(servoTiltHome);
  Serial.println("Mechanism initialized");
}

void reachDestination(int destination){
  Serial.println("Moving to: ");Serial.println(destination);
  int targetBaseAngle;
  int targetTiltAngle;
  
  switch(destination){
    case plasticBin:
      targetBaseAngle = servoBaseHome;
      targetTiltAngle = servoTiltForward;
      break;
    
    case paperBin:
      targetBaseAngle = servoBaseRotate;
      targetTiltAngle = servoTiltForward;
      break;
    
    case metalBin:
      targetBaseAngle = servoBaseHome;
      targetTiltAngle = servoTiltBackward;
      break;
    
    default:
      targetBaseAngle = servoBaseRotate;
      targetTiltAngle = servoTiltBackward;
      break;
  }
  
  if(targetBaseAngle != currentBaseAngle){
    servoRotate(servoBase, currentBaseAngle, targetBaseAngle);
  }
  delay(servoPauseDelayMS);
  
  servoRotate(servoTilt, servoTiltHome, targetTiltAngle);
  delay(servoPauseDelayMS);
  
  servoRotate(servoTilt, targetTiltAngle, servoTiltHome);
  delay(servoPauseDelayMS);  
  
  currentBaseAngle = targetBaseAngle;
}

void servoRotate(Servo &servo, int startAngle, int endAngle){
  if(startAngle < endAngle){
    for(int a = startAngle; a <= endAngle; a += servoStepSize){
      servo.write(a);
      delay(servoStepDelayMS);
    }
  }
  else{
    for(int a = startAngle; a >= endAngle; a -= servoStepSize){
      servo.write(a);
      delay(servoStepDelayMS);
    }
  }
}
