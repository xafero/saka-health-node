
// Load utilities
var util = require('./helpers');

// Load BlueTooth module
var noble = require('noble');

// Load OS and UDP module
var os = require('os');
var dgram = require('dgram');

// Interesting UUIDs
var heartRateId = '180d';
var serviceUUIDs = [ heartRateId ];

// Set UDP options
var port = 8989;
var sPort = 8988;
var host = '127.0.0.1';

// Create UDP client
var client = dgram.createSocket('udp4');

// Create value callback
var onHeartRate = function(buff) {
    // Decrypt mystic buffer
    var flags = buff.readUInt8(0);
    var rate = buff.readUInt8(1);
    var joule = -1;
    if (buff.length > 2) {
        joule = buff.readUInt16LE(2);
    }
    var rr = -1;
    if (buff.length > 4) {
        rr = buff.readUInt16LE(4);
    }
    // Send it over network
    var nl = os.EOL;
    var sep = ',';
    var msg = flags + sep + rate + sep + joule + sep + rr;
    var data = new Buffer(msg + nl);
    client.send(data, 0, data.length, port, host, function(error, bytes) {
        if (error) {
            console.log('Error while sending! ', error);
            return;
        }
        console.log(' SENT to '+host+':'+port+' => '+msg);
    });
};

// Create scale callback
var onScaleWeight = function(buff) {
    // Decrypt mystic buffer
    var weightKg = buff.readUInt16BE(4) / 10.0;
    // Send it over network
    var nl = os.EOL;
    var msg = weightKg;
    var data = new Buffer(msg + nl);
    client.send(data, 0, data.length, sPort, host, function(error, bytes) {
        if (error) {
            console.log('Error while sending!', error);
            return;
        }
        console.log(' SENT to '+host+':'+sPort+' => '+msg);
    });
};

// Create discover callback
var discover = function (device) {
    var dev = util.niceDev(device);
    // Special case for this scale
    if (dev.Name === 'YoHealth') {
        onScaleWeight(device.advertisement.manufacturerData);
        return;
    }
    // Ignore crappy devices without name and services!
    if (!dev.Name || dev.Services.length == 0) {
        return;
    }
    // Handle normal devices
    console.log('Found device: ', dev);
    device.connect(function(error) {
        if (error) {
            console.log('Error while connecting! ', error);
            return;
        }
        console.log('Connected to device: ', util.niceDev(device).Address);
        device.discoverServices(serviceUUIDs, function(error, services) {
            if(error) {
                console.log('Error while discovering! ', error);
                return;
            }
            var svcCount = services.length;
            console.log('Discovered ', svcCount, ' services!');
            for (var i = 0; i < svcCount; i++) {
                var service = services[i];
                console.log('Service ', i, ': ', util.niceSvc(service));
                service.discoverIncludedServices();
                service.discoverCharacteristics();
                // Wait for includes
                service.once('includedServicesDiscover', function(includedServiceUuids) {
                    for (var i=0; i < includedServiceUuids; i++) {
                        var isu = includedServiceUuids[i];
                        console.log('Found included service: ', isu);
                    }
                });
                // Wait for characters
                service.once('characteristicsDiscover', function(characteristics) {
                    for (var i=0; i < characteristics.length; i++) {
                        var char = characteristics[i];
                        console.log('Found characteristic: ', util.niceChar(char));
                        char.discoverDescriptors(function(error, descriptors) {
                            if (error) {
                                console.log('Error while descripting! ', error);
                                return;
                            }
                            for (var i=0; i < descriptors.length; i++) {
                                var desc = descriptors[i];
                                console.log('Found descriptor: ', util.niceDesc(desc));
                                desc.readValue(function (error, data) {
                                    if (error) {
                                        console.log('Error while reading! ', error);
                                        return;
                                    }
                                    console.log('Descriptor value: ', data.toString('hex'));
                                });
                            }
                        });
                        char.notify(true, function(error) {
                            if (error) {
                                console.log('Error while notifying! ', error);
                            }
                        });
                        char.on('data', function(data, isNotification) {
                            onHeartRate(data);
                        });
                    }
                });
            }
        });
        // TODO: Maybe - peripheral.disconnect([callback(error)])
    });
};

// Register discover callback
noble.on('discover', discover);

// Create state callback
var states = function (state) {
    console.log(state);
    if (state == 'poweredOn') {
        console.log('Trying to find devices...');
        // Start scanning
        var pollMs = 100;
        setInterval(function() {
            var allowDuplicates = true;
            var uuids = [];
            noble.startScanning(uuids, allowDuplicates);
        }, pollMs);
        // TODO: Maybe - noble.stopScanning()
    }
};

// Register state callback
noble.on('stateChange', states);
