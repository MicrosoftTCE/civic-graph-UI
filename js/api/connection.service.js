/**
 * Created by brianavecchione on 6/27/16.
 */
(function (angular) {

    "use strict";

    var url = "/connections";

    function isDefined(o) {
        return !(typeof o === "undefined" || o === null);
    }

    function getConnectionTypes() {
        return {
            "Funding": true,
            "Data": true,
            "Employment": true,
            "Collaboration": true
        };
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

    function Connection(obj) {
        var getProperty = getPropertyFromObj(obj);

        this.id = getProperty("id");
        this.name = getProperty("name");
        this.details = getProperty("details");
        this.entity = getProperty("entity");
        this.entity_id = getProperty("entity_id");
    }

    function getConnectionModel(obj) {
        return new Connection(obj);
    }

    function Service(apiCaller) {
        function getAll() {
            return apiCaller.get(url);
        }

        return {
            "getAll": getAll,
            "getConnectionTypes": getConnectionTypes,
            "getConnectionModel": getConnectionModel
        };
    }

    Service.$inject = ["cgApiCaller"];

    angular
        .module("civic-graph.api")
        .factory("connectionService", Service);

})(angular);