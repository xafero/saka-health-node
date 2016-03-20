
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
    },

    niceChar: function (char) {
        var id = char.uuid;
        var name = char.name;
        var type = char.type;
        var prop = char.properties;
        return {UUID: id, Name: name, Type: type, Props: prop};
    },

    niceDesc: function (desc) {
        var id = desc.uuid;
        var name = desc.name;
        var type = desc.type;
        return {UUID: id, Name: name, Type: type};
    }

};
