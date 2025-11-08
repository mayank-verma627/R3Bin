#include "config.h"

void initRpi(){
  Serial2.begin(9600, SERIAL_8N1, RPISerialRX, RPISerialTX);
  Serial.println("Rpi initialized");
  Serial.println("=================================");
  Serial.println("Manual Control Available:");
  Serial.println("Type numbers in Serial Monitor to manually control:");
  Serial.println("  1 = Plastic Bin");
  Serial.println("  2 = Paper Bin");
  Serial.println("  3 = Metal Bin");
  Serial.println("  4 = Miscellaneous Bin");
  Serial.println("  0 = Home Position");
  Serial.println("=================================\n");
}

void sendInt(int value){
  Serial2.println(value);
  //delay(200);c
  Serial.print("Sending value to RPi: ");
  Serial.println(value);
}

int receiveInt(){
  unsigned long startTime = millis();
  unsigned long timeout = 5000;  // 5 second timeout
  
  while(millis() - startTime < timeout)
  {
    if(Serial2.available() > 0){
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
  sendInt(val);
  return receiveInt();
}

// NEW FUNCTION: Check for keyboard input from Serial Monitor
void checkKeyboardInput(){
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    if (input.length() > 0) {
      int value = input.toInt();
      
      // Validate input
      if (value >= 0 && value <= 4) {
        Serial.println("\n>>> MANUAL COMMAND <<<");
        Serial.print("User input: ");
        Serial.println(value);
        
        // Send to RPi
        sendInt(value);
        
        // Optional: wait for response
        delay(100);
        if (Serial2.available() > 0) {
          int response = receiveInt();
          Serial.print("RPi Response: ");
          Serial.println(response);
        }
        
        Serial.println(">>> END MANUAL COMMAND <<<\n");
      } else {
        Serial.println("[ERROR] Invalid input! Enter 0-4 only.");
      }
    }
  }
  
  // Check for responses from RPi (non-blocking)
  if (Serial2.available() > 0) {
    int response = Serial2.parseInt();
    if (response != 0) {
      Serial.print("[UNSOLICITED from RPi] <<< ");
      Serial.println(response);
    }
  }
}
