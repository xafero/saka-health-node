
// Load utilities
var util = require('./helpers');

// Load BlueTooth module
var noble = require('noble');

// Interesting UUIDs
var serviceUUIDs = [];

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
            }
        });
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
    }
};

// Register state callback
noble.on('stateChange', states);
