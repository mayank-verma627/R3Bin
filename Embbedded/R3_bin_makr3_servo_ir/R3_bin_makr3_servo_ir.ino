#include <ESP32Servo.h>

// Servo pins
#define SERVO_BASE_PIN 12
#define SERVO_TILT_PIN 14

Servo servoBase;
Servo servoTilt;

// Metal sensor pins
#define METAL_SENSOR_PIN 15
#define METAL_SENSOR_PIN2 39

// IR sensor pin
#define IR_SENSOR_PIN 33

// Serial pins
#define ESP32_RX2 16
#define ESP32_TX2 17

// Servo angles
const int BASE_BIN1 = 45;
const int BASE_BIN2 = 135;
const int BASE_BIN3 = 45;  // bin3 doesn't rotate base
const int BASE_BIN4 = 135;

const int TILT_HOME = 92;
const int TILT_FORWARD = 70;
const int TILT_BACKWARD = 140;

// Smooth motion
const int STEP_SIZE = 2;
const int STEP_DELAY = 0;

// Track current base position
int currentBaseAngle = BASE_BIN1;

void setup() {
  Serial.begin(115200);
  Serial2.begin(115200, SERIAL_8N1, ESP32_RX2, ESP32_TX2);

  servoBase.attach(SERVO_BASE_PIN);
  servoTilt.attach(SERVO_TILT_PIN);

  servoBase.write(currentBaseAngle);
  servoTilt.write(TILT_HOME);

  pinMode(METAL_SENSOR_PIN, INPUT);
  pinMode(METAL_SENSOR_PIN2, INPUT);
  pinMode(IR_SENSOR_PIN, INPUT);

  Serial.println("Bin Ready");
}

void loop() {
  // Metal sensor trigger
  Serial.println("Bin Ready....Put Waste");

  // IR sensor trigger
  if (digitalRead(IR_SENSOR_PIN) == LOW) {
    Serial.println("Object detected by IR sensor -> Sending 1 to Raspberry Pi");
    //delay(500);
    if (digitalRead(METAL_SENSOR_PIN) == HIGH || digitalRead(METAL_SENSOR_PIN2) == HIGH) {
    Serial.println("Metal detected -> Sending 3 to Raspberry Pi");
    Serial2.println(3); // notify RPi
    moveToBin(3);
    delay(500); 
    return;
  }
    Serial2.println(1); // notify RPi
    // Wait for RPi to respond with target bin
    while (Serial2.available() == 0);
    int received = Serial2.parseInt();
    int bin = convert(received);

    Serial.print("Received bin from RPi: ");
    Serial.println(bin);
    moveToBin(bin);
    delay(500);
  }
}

// Move to bin
void moveToBin(int bin) {
  int targetBase = currentBaseAngle;
  int targetTilt = TILT_HOME;

  switch(bin) {
    case 1:
      targetBase = BASE_BIN1;
      targetTilt = TILT_FORWARD;
      break;
    case 2:
      targetBase = BASE_BIN2;
      targetTilt = TILT_FORWARD;
      break;
    case 3:
      targetBase = BASE_BIN3;
      targetTilt = TILT_BACKWARD;
      break;
    case 4:
      targetBase = BASE_BIN4;
      targetTilt = TILT_BACKWARD;
      break;
    default:
      Serial.println("Invalid bin");
      return;
  }

  if (currentBaseAngle != targetBase) moveServoSmooth(servoBase, currentBaseAngle, targetBase);
  delay(500);
  moveServoSmooth(servoTilt, TILT_HOME, targetTilt);
  delay(500);
  moveServoSmooth(servoTilt, targetTilt, TILT_HOME);

  currentBaseAngle = targetBase;
}

// Smooth servo motion
void moveServoSmooth(Servo &servo, int startAngle, int endAngle) {
  if (startAngle < endAngle) {
    for (int a = startAngle; a <= endAngle; a += STEP_SIZE) {
      servo.write(a);
      delay(STEP_DELAY);
    }
  } else {
    for (int a = startAngle; a >= endAngle; a -= STEP_SIZE) {
      servo.write(a);
      delay(STEP_DELAY);
    }
  }
}

int convert(int a) { 
    return (a > 10) ? a % 10 : a; 
}
