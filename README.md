# HAF marionette system

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
Baud rate of the serial port. Default ```9600```



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

### PICAN2

```
sudo /sbin/ip link set can0 up type can bitrate 500000
```