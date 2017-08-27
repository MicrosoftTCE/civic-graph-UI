/**
 * Created by brianavecchione on 6/27/16.
 */
(function (angular) {

    "use strict";

    function Service(utils) {
        function Location(obj) {
            var self = this;

            var getProperty = utils.getPropertyFromObj(obj);

            function buildFormattedAddress() {
                var defObj = utils.isDefined(obj) ? obj : {};
                var addressLine = (utils.isDefined(defObj.address_line) ? defObj.address_line +  ' ' : '');
                var locality = (utils.isDefined(defObj.locality) ? defObj.locality + ', ' : '');
                var countryCode = (utils.isDefined(defObj.country_code) ? defObj.country_code + ' ' : '');
                var postalCode = (utils.isDefined(defObj.postal_code) ? defObj.postal_code : '');

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

        function getLocationModel(obj) {
            return new Location(obj);
        }

        return {
            "getLocationModel": getLocationModel
        };
    }

    Service.$inject = ["cgUtilService"];

    angular
        .module('civic-graph.api')
        .factory('locationService', Service);

})(angular);