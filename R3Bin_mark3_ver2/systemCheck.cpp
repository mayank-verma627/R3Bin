//#include "config.h"
////===============Error Status========================
////Error 101 for any of the ir sensors not working 
////   Error 101.1 for irSensor1
////   Error 101.2 for irSensor2
////   Error 101.3 for irSensor3
////   Error 101.4 for irSensor4
////   Error 101.5 for irSensor5
////   Error 101.6 for irSensor6
////
////Error 102 for Rpi communication failure
////Error 103 for Wifi not working or connected 
////Error 104 for Supabase error while uploading 
////===================================================
//
//int irLowStartTime=0;
//bool irWasLow = false;
//const unsigned long irCheckTime = 10000;
//const unsigned int threshold = 2000;
//
//bool irCheck(int irPin){
//  if(analogRead(irPin) < threshold){
//    if(!irWasLow){
//      irLowStartTime = millis();
//      irWasLow = true;
//    }
//  }
//  
//}
//
//bool rpiCheck(){
//  
//}
//
//bool WifiCheck(){
//  
//}
//
//bool supabaseCheck(){
//  
//}
//
//
//void statusLED(){
//  
//}
