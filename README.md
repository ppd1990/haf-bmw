# HAF-BMW marionette system

## Hardware setup

1. Attach 5V power source to V+ and GND of the LED strips.
2. Connect power GND and Arduino GND
3. Connect steering wheel position (long) LED strip DATA to Arduino port 6
4. Connect indicator (short) LED strip DATA to Arduino port 7
5. Connect Arduino to Raspberry (USB)
6. Connect G29 steering wheel power input
7. Connect G29 steering wheel to Raspberry (USB)
8. Connect PICAN2 to CAN BUS (CAN_H, CAN_L, GND)

## Installation

Use node v8. Not v10 and above. SocketCAN does not compile otherwise.

### Fix permissions for user access of steering wheel
create ```/etc/udev/rules.d/99-hidraw-permissions.rules``` with
content
```
KERNEL=="hidraw*", SUBSYSTEM=="hidraw", MODE="0664", GROUP="plugdev"
```

### Fix permissions for user access of arduino in Ubuntu/Debian
Add user to group ```dialout```
```
sudo adduser $USER dialout
```

### Install dependencies
```npm install```
It might be necessary to install some headers to compile.

On Ubuntu/Debian:
```
sudo apt install libudev-dev libsocketcan-dev libusb-dev libusb-1.0-0-dev
```

### Install firmware to Arduino
Flash ```arduino/hafLeds.ino``` to Arduino with Arduino IDE or similar.
Confirm it is operational. Connect to serial port (9600 baud) and reset the board.
It should return ```ready\n``` after a short time.

## Configuration
Set in ```config/default.json``` the following options

### ```canInterface```
SocketCAN interface, e.g. ```can0```

### ```serialPort```
Serial port where the LED driver board is to befound. E.g. ```/dev/ttyACM0```

### ```baudRate```
Baud rate of the serial port. Default ```115200```

### ```accelerationLEDs```
Number of LEDs to use for one half of the acceleration bar display.
It will use ```2 * accelerationLEDs + 1``` for the whole display.
Must confirm to arduino settings.

### ```steeringWheelLEDs```
Number of LEDs to use for the steering wheel position indicator.
Must confirm to arduino settings.



## Running

### Set up CAN interface

#### Virtual
```
# create interface
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0
# replay collected frames on virtual interface
canplayer vcan0=can0 -I ../candump-2018-05-26_164900.log
```

#### PICAN2

```
sudo /sbin/ip link set can0 up type can bitrate 500000
```

### Run haf-bmw
```
node src/index.js
```