/**
 * Created by brianavecchione on 6/27/16.
 */
(function(angular){

    "use strict";

    function Service(utils) {

        function FundingConnection(obj) {
            var getProperty = utils.getPropertyFromObj(obj);

            this.id = getProperty("id");
            this.year = getProperty("year");
            this.amount = getProperty("amount");
            this.entity = getProperty("entity", "");
        }

        function getFundingConnectionModel(obj){
            return new FundingConnection(obj);
        }

        return {
            "getFundingConnectionModel": getFundingConnectionModel
        };
    }

    Service.$inject = ["cgUtilService"];

    angular
        .module("civic-graph.api")
        .factory("fundingConnectionService", Service);

})(angular);
