#include "config.h"

void initRpi(){
  Serial2.begin(115200, SERIAL_8N1, RPISerialRX, RPISerialTX);
  Serial.println("Rpi initialized");
}

void sendInt(int value){
  Serial2.println(value);
  Serial.print("Sending value to RPi: ");
  Serial.println(value);
}

int receiveInt(){  // FIXED: Typo "recieveInt" -> "receiveInt"
  unsigned long startTime = millis();
  unsigned long timeout = 5000;  // 5 second timeout
  
  while(millis() - startTime < timeout){  // FIXED: Added timeout instead of infinite loop
    if(Serial2.available() > 0){  // FIXED: Check if data is available
      int received = Serial2.parseInt();
      received = toConvert(received);
      Serial.print("Received value from RPi: ");
      Serial.println(received);
      return received;
    }
  }
  
  Serial.println("Timeout: No response from RPi");
  return -1;  // Return -1 on timeout
}

int toConvert(int a){
  return (a > 10) ? a % 10 : a; 
}

int sendAndReceiveInt(int val){
  sendInt(val);  // FIXED: Typo "sentInt" -> "sendInt"
  return receiveInt();  // FIXED: Typo "recieveInt" -> "receiveInt"
}
