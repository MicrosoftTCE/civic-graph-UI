(function (angular) {

    "use strict";

    function isDefined(o) {
        return !(typeof o === "undefined" || o === null);
    }

    function isObject(o) {
        return isDefined(o) && !Array.isArray(o) && (typeof o === "object");
    }

    function getPropertyFromObj(obj) {
        var defObj = isDefined(obj) ? obj : {};

        return function (property, defaultValue) {
            var value = isDefined(defaultValue) ? defaultValue : null;
            return isDefined(defObj[property])
                ? defObj[property]
                : value;
        };
    }

    function loopAndInit(modelArray, initModelFunction) {
        var newArray = Array.isArray(modelArray)
            ? modelArray.filter(isObject).map(initModelFunction)
            : [];

        return newArray.concat([initModelFunction()]);
    }

    function Service() {
        return {
            "isDefined": isDefined,
            "isObject": isObject,

            "getPropertyFromObj": getPropertyFromObj,
            "loopAndInit": loopAndInit
        };
    }

    angular
        .module("civic-graph.util")
        .factory("cgUtilService", Service);

})(angular);
