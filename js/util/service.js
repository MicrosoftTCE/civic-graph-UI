(function (angular) {

    "use strict";

    /**
     * @typedef {Object} CgUtilService
     * @property {Function} isDefined
     * @property {Function} isObject
     * @property {Function} isString
     * @property {Function} getPropertyFromObj
     * @property {Function} loopAndInit
     */

    /**
     * Returns true iff typeof o is undefined or o is null
     * @param o
     * @returns {boolean}
     */
    function isDefined(o) {
        return !(typeof o === "undefined" || o === null);
    }

    /**
     * Returns true iff o is defined and typeof o is object and o is not array
     * @param o
     * @returns {boolean}
     */
    function isObject(o) {
        return isDefined(o) && !Array.isArray(o) && (typeof o === "object");
    }

    /**
     * Returns true iff o is defined and typeof o is string
     * @param o
     * @returns {boolean}
     */
    function isString(o) {
        return isDefined(o) && typeof o === "string";
    }

    /**
     * Returns a method that takes the property to be found and a default value
     * @param {Object} obj - the object to search in
     * @returns {Function}
     */
    function getPropertyFromObj(obj) {
        var defObj = isObject(obj) ? obj : {};

        return function (property, defaultValue) {
            var value = isDefined(defaultValue) ? defaultValue : null;
            return isDefined(defObj[property])
                ? defObj[property]
                : value;
        };
    }

    /**
     * Nice util method for applying the constructor method for a class to an array of objects
     *
     * @param {Array.<Object>} modelArray
     * @param {Function} initModelFunction
     * @returns {Array.<*>}
     */
    function loopAndInit(modelArray, initModelFunction) {
        var newArray = Array.isArray(modelArray)
            ? modelArray.filter(isObject).map(initModelFunction)
            : [];

        return newArray.concat([initModelFunction()]);
    }

    /**
     * @returns {CgUtilService}
     * @constructor
     */
    function Service() {
        return {
            "isDefined": isDefined,
            "isObject": isObject,
            "isString": isString,

            "getPropertyFromObj": getPropertyFromObj,
            "loopAndInit": loopAndInit
        };
    }

    angular
        .module("civic-graph.util")
        .factory("cgUtilService", Service);

})(angular);
