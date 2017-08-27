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

    function Finance(obj) {
        var getProperty = getPropertyFromObj(obj);

        this.id = getProperty("id");
        this.year = getProperty("year");
        this.amount = getProperty("amount", 0);
    }

    function getFinanceModel(obj) {
        return new Finance(obj);
    }

    function Service() {
        return {
            "getFinanceModel": getFinanceModel
        };
    }

    angular
        .module("civic-graph.api")
        .factory("financeService", Service);

})(angular);