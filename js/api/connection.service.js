/**
 * Created by brianavecchione on 6/27/16.
 */
(function (angular) {

    "use strict";

    var url = "/connections";

    var connectionTypeObj = {
        "Funding": true,
        "Data": true,
        "Employment": true,
        "Collaboration": true
    };

    function getConnectionTypes() {
        return connectionTypeObj;
    }

    function Service(apiCaller, utils) {

        function Connection(obj) {
            var getProperty = utils.getPropertyFromObj(obj);

            this.id = getProperty("id");
            this.name = getProperty("name");
            this.details = getProperty("details");
            this.entity = getProperty("entity");
            this.entity_id = getProperty("entity_id");
        }

        function getConnectionModel(obj) {
            return new Connection(obj);
        }

        function getAll() {
            return apiCaller.get(url);
        }

        return {
            "getAll": getAll,
            "getConnectionTypes": getConnectionTypes,
            "getConnectionModel": getConnectionModel
        };
    }

    Service.$inject = ["cgApiCaller", "cgUtilService"];

    angular
        .module("civic-graph.api")
        .factory("connectionService", Service);

})(angular);
