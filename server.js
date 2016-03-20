
// Load utilities
var util = require('./helpers');

// Load BlueTooth module
var noble = require('noble');

// Interesting UUIDs
var heartRateId = '180d';
var serviceUUIDs = [ heartRateId ];

// Create value callback
var onHeartRate = function(buffer) {
    // TODO: Handle that!
    console.log('h ', buffer.toString('hex'));
};

// Create discover callback
var discover = function (device) {
    console.log('Found device: ', util.niceDev(device));
    device.connect(function(error) {
        if (error) {
            console.log('Error while connecting! ', error);
            return;
        }
        console.log('Connected to device: ', util.niceDev(device).Name);
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
                                    console.log('Descriptor value: ', data);
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
        var allowDuplicates = false;
        noble.startScanning(serviceUUIDs, allowDuplicates);
        // TODO: Maybe - noble.stopScanning()
    }
};

// Register state callback
noble.on('stateChange', states);
