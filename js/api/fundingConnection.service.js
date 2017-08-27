/**
 * Created by brianavecchione on 6/27/16.
 */
(function(angular){

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

    function FundingConnection(obj) {
        var getProperty = getPropertyFromObj(obj);

        this.id = getProperty("id");
        this.year = getProperty("year");
        this.amount = getProperty("amount");
        this.entity = getProperty("entity", "");
    }

    function getFundingConnectionModel(obj){
        return new FundingConnection(obj);
    }

    function Service() {
        return {
            "getFundingConnectionModel": getFundingConnectionModel
        };
    }

    angular
        .module("civic-graph.api")
        .factory("fundingConnectionService", Service);

})(angular);
