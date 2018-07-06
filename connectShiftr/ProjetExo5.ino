#include <Bridge.h>
#include <BridgeClient.h>
#include <MQTT.h>

#include "DHT.h"
#define DHTPIN A1     // what digital pin we're connected to
#define DHTTYPE DHT11   // DHT 11


BridgeClient net;
MQTTClient client;
const int pinLed=2;
bool etatAllumage = true;
DHT dht(DHTPIN, DHTTYPE);
String tempMessage = "";

unsigned long lastMillis = 0;

void connect() {
  Serial.print("connecting...");
  while (!client.connect("lens_Afid3mH8TyOQwGtvn4FAMw6BJAZ", "bd978efd", "5290e98ac79955d1")) {
    Serial.print(".");
    delay(1000);
  }

  Serial.println("\nconnected!");

  client.subscribe("/LED");
  // client.unsubscribe("/hello");
}

/*void messageReceived(String &topic, String &payload) {
  Serial.println("incoming: " + topic + " - " + payload);
} */

void setup() {
  Bridge.begin();
  Serial.begin(115200);

  // Note: Local domain names (e.g. "Computer.local" on OSX) are not supported by Arduino.
  // You need to set the IP address directly.
  client.begin("broker.shiftr.io", net);
  client.onMessage(messageReceived);

  connect();

  Serial.begin(9600);
  Serial.println("DHTxx test!");

  dht.begin();
}

void loop() {

  // PARTIE ALLUMAGE LED ######################################
  client.loop();
  if (!client.connected()) {
    connect();
  }
  if (etatAllumage == true) {
    digitalWrite(pinLed,HIGH);
  } else {
    digitalWrite(pinLed,LOW);
  }

/*  if(millis() - lastMillis > 2000) {
    lastMillis = millis();
    client.publish("/hello", "world");
  }*/

  // PARTIE TEMPERATURE ######################################
  float h = dht.readHumidity();
  // Read temperature as Celsius (the default)
  float t = dht.readTemperature();
  // Read temperature as Fahrenheit (isFahrenheit = true)
  float f = dht.readTemperature(true);

  // Check if any reads failed and exit early (to try again).
  if (isnan(h) || isnan(t) || isnan(f)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // Compute heat index in Fahrenheit (the default)
  float hif = dht.computeHeatIndex(f, h);
  // Compute heat index in Celsius (isFahreheit = false)
  float hic = dht.computeHeatIndex(t, h, false);

    if(millis() - lastMillis > 2000) {
    lastMillis = millis();
    tempMessage = "Temperature : ";
    tempMessage += t;
    tempMessage += " *C";
    client.publish("/Temperature", tempMessage);
  }
}

void messageReceived(String &topic, String &payload) {
  Serial.print("incoming: ");
  Serial.print(topic);
  Serial.print(" - ");
  Serial.print(payload);
  Serial.println();
  if (payload == "on") {
    etatAllumage = true;
  } else if (payload == "off") {
    etatAllumage = false;
  } 
}
