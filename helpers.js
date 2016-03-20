
module.exports = {

    niceDev: function (device) {
        var addr = device.address;
        var name = device.advertisement.localName;
        var svcs = device.advertisement.serviceUuids;
        return {Address: addr, Name: name, Services: svcs};
    },

    niceSvc: function (service) {
        var id = service.uuid;
        var name = service.name;
        var type = service.type;
        return {UUID: id, Name: name, Type: type};
    }

};
