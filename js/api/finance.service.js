/**
 * Created by brianavecchione on 6/27/16.
 */
(function (angular) {

    "use strict";

    function Service(utils) {
        function Finance(obj) {
            var getProperty = utils.getPropertyFromObj(obj);

            this.id = getProperty("id");
            this.year = getProperty("year");
            this.amount = getProperty("amount", 0);
        }

        function getFinanceModel(obj) {
            return new Finance(obj);
        }

        return {
            "getFinanceModel": getFinanceModel
        };
    }

    Service.$inject = ["cgUtilService"];

    angular
        .module("civic-graph.api")
        .factory("financeService", Service);

})(angular);