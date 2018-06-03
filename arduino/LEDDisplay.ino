#include <Adafruit_NeoPixel.h>

struct Strip {
    Strip(Adafruit_NeoPixel& pixels) : pixels(pixels) {}
    Adafruit_NeoPixel& pixels;
    boolean isDirty = false;
    boolean show() {
      if (isDirty) {
        pixels.show();
        isDirty = false;
        return true;
      }
      return false;
    }
};

Adafruit_NeoPixel wheelPixels = Adafruit_NeoPixel(115, 6, NEO_GRB + NEO_KHZ800);
Adafruit_NeoPixel indicatorPixels = Adafruit_NeoPixel(29, 7, NEO_GRB + NEO_KHZ800);

Strip wheelStrip = Strip(wheelPixels);
Strip indicatorStrip = Strip(indicatorPixels);

String inputBuffer = ""; 
boolean cmdComplete = false;

class Timer {
  public:
    Timer(unsigned int interval, void (*cb)()) : interval(interval), cb(cb) {}
    void start() {
      running = true;
      lastTime = millis();
    }
    void stop() {
      running = false;
    }
    boolean tick() {
      if (!running) {
        return false;
      }
      unsigned long now = millis();
      if ((now - lastTime) > interval) {
        lastTime = now;
        cb();
        return true;
      }
      return false;
    }
    boolean isRunning() {
      return running;
    }
  private:
    unsigned int interval;
    boolean running = false;
    unsigned long lastTime = 0;
    void (*cb)();
};


class Blinker {
  public:
    Blinker(Strip& strip, unsigned int offset = 0, unsigned int length = 3, uint32_t color = 0xffff00) : offset(offset), length(length), strip(strip), color(color) {}
    void toggle() {
      set(!on);
    }
    void set(boolean _on) {      
      on = _on;
      for (int i = 0; i < length; i++) {
        strip.pixels.setPixelColor(i + offset, on ? color : 0);
      }
      strip.isDirty = true;
    }
  private:
    boolean on = false;
    Strip& strip;
    unsigned int offset = 0;
    unsigned int length = 3;
    uint32_t color;
};

class CenteredBar {
  public:
    CenteredBar(Strip& strip, unsigned int center, unsigned int noOfLeds) : 
      strip(strip),  
      center(center),
      noOfLeds((noOfLeds)) {}

    void set(unsigned int ledsOn, uint32_t color) {
      if (ledsOn > noOfLeds + 1) {
        ledsOn = noOfLeds + 1;
      }
      for (int i = 0; i <= noOfLeds; i++) {
        strip.pixels.setPixelColor(center + i, 0);
        strip.pixels.setPixelColor(center - i, 0);
      }
      if (ledsOn > 0) {
        strip.pixels.setPixelColor(center, color);
      }
      for (int i = 1; i < ledsOn; i++) {
        strip.pixels.setPixelColor(center + i, color);
        strip.pixels.setPixelColor(center - i, color);
      }
      strip.isDirty = true;
    }
  private:
    unsigned int center = 0;
    unsigned int noOfLeds = 0;
    Strip& strip;
};

class Dot {
  public:
    Dot(Strip& strip, uint32_t color = 0x0000ff) :
      strip(strip),
      color(color),
      stripLength(strip.pixels.numPixels()) {}
      
    void setStripLength(unsigned int length) {
      stripLength = length;
    }

    void setOffset(unsigned int _offset) {
      offset = _offset;
    }

    void set(int position) {
      strip.isDirty = true;
      if (position > (stripLength - 1)) {
        position = stripLength - 1;
      }
      for (int i = 0; i < stripLength; i++) {
        strip.pixels.setPixelColor(offset + i, 0);
      }
      if (position < 0) {
        return;
      }
      strip.pixels.setPixelColor(offset + position, color);
      for (int i = 1; i <= padding; i++) {
        int iHigh = position + i;
        int iLow =  position - i;
        if (iHigh < stripLength) {
          strip.pixels.setPixelColor(offset + iHigh, color);
        }
        if (iLow >= 0) {
          strip.pixels.setPixelColor(offset + iLow, color);
        }
      }
    }
  private:
    uint32_t color = 0;
    unsigned int offset = 0;
    unsigned int padding = 1;
    int stripLength = 0;
    Strip& strip;
};

// blinkers
Blinker blinkerLeft = Blinker(indicatorStrip);
Blinker blinkerRight = Blinker(indicatorStrip, 26);

void toggleLeftBlinker() {
  blinkerLeft.toggle();
}

void toggleRightBlinker() {
  blinkerRight.toggle();
}

Timer blinkerLeftTimer = Timer(500, &toggleLeftBlinker);
Timer blinkerRightTimer = Timer(500, &toggleRightBlinker);

// throttle & brake
CenteredBar accelerationBar = CenteredBar(indicatorStrip, 14, 11);

// steering wheel dot
Dot steeringWheel = Dot(wheelStrip);

void setup() {
  Serial.begin(115200);
  inputBuffer.reserve(100);
  wheelStrip.pixels.begin();
  wheelStrip.pixels.clear();
  indicatorStrip.pixels.begin();
  indicatorStrip.pixels.clear();
  wheelStrip.isDirty = true;
  indicatorStrip.isDirty = true;
  indicatorStrip.show();
  wheelStrip.show();
  Serial.print("ready\n");
}

void loop() {
  boolean cmdDone = false;
  if (cmdComplete) {
    execCmd(inputBuffer);
    inputBuffer = "";
    cmdComplete = false;
    cmdDone = true;
  }
  blinkerLeftTimer.tick();
  blinkerRightTimer.tick();
  indicatorStrip.show();
  wheelStrip.show();
  if (cmdDone) {
    Serial.print("k\n");
  }
}

void setBlinker(Blinker& blinker, Timer& timer, boolean on) {
  if (on) {
    if (!timer.isRunning()) {
      blinker.set(true);
      timer.start();
    }
  } else {
    blinker.set(false);
    timer.stop();
  }
}

void setBlinkers(int state) {
  int leftOn = state & 1;
  int rightOn = (state >> 1) & 1;
  setBlinker(blinkerLeft, blinkerLeftTimer, leftOn);
  setBlinker(blinkerRight, blinkerRightTimer, rightOn);
}

void setAcceleration(int leds) {
  uint32_t color = leds < 0 ? 0xff0000 : 0x228b22;
  leds = leds < 0 ? -leds : leds;
  accelerationBar.set(leds, color);
}

boolean execCmd(String& cmd) {
  int args[3] = {0};
  int startFrom = 0;
  int i = 0;
  for (; i < 2; i++) {
    int commaIndex = cmd.indexOf(',', startFrom);
    if (commaIndex == -1) {
      return false;
    }
    args[i] = cmd.substring(startFrom, commaIndex).toInt();
    startFrom = commaIndex + 1;
  }
  args[i] = cmd.substring(startFrom).toInt();

  steeringWheel.set(args[0]);
  setAcceleration(args[1]);
  setBlinkers(args[2]);
  return true;
}

char lastChar = 0;
void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      cmdComplete = true;
      return;
    }
    lastChar = inChar;
    inputBuffer += inChar;
  }
}
