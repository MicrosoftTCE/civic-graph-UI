/**
 * Created by brianavecchione on 6/27/16.
 */
(function (angular) {

    "use strict";

    function isDefined(o) {
        return !(typeof o === "undefined" || o === null);
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

    function Location(obj) {
        var self = this;

        var getProperty = getPropertyFromObj(obj);

        function buildFormattedAddress() {
            var defObj = isDefined(obj) ? obj : {};
            var addressLine = (isDefined(defObj.address_line) ? defObj.address_line +  ' ' : '');
            var locality = (isDefined(defObj.locality) ? defObj.locality + ', ' : '');
            var countryCode = (isDefined(defObj.country_code) ? defObj.country_code + ' ' : '');
            var postalCode = (isDefined(defObj.postal_code) ? defObj.postal_code : '');

            return (addressLine + locality + countryCode + postalCode).trim();
        }

        self.id = getProperty("id");
        self.address_line = getProperty("address_line");
        self.locality = getProperty("locality");
        self.district = getProperty("district");
        self.postal_code = getProperty("postal_code");
        self.country = getProperty("country");
        self.country_code = getProperty("country_code");
        self.coordinates = getProperty("coordinates");

        // TODO: Convert this to a method that builds based off of the current object's properties.
        // Unless this is needed for the API specifically, then have this built in a similar function as the one in
        // EntityModel for building API specific objects
        self.formattedAddress = buildFormattedAddress();
    }

    function Service() {
        function getLocationModel(obj) {
            return new Location(obj);
        }

        return {
            "getLocationModel": getLocationModel
        };
    }

    angular
        .module('civic-graph.api')
        .factory('locationService', Service);

})(angular);