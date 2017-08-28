/**
 * Created by brianavecchione on 6/28/16.
 */

(function (angular) {

    "use strict";

    function Service(apiCaller, utils) {

        function Category(obj) {
            var getProperty = utils.getPropertyFromObj(obj);

            this.id = getProperty("id");
            this.name = getProperty("name");
            this.enabled = getProperty("enable", true);
        }

        function getCategoryModel(obj) {
            return new Category(obj);
        }

        function getAll() {
            return apiCaller.get("/categories");
        }

        return {
            "getCategoryModel": getCategoryModel,
            "getAll": getAll
        };
    }

    Service.$inject = ["cgApiCaller", "cgUtilService"];

    angular
        .module("civic-graph.api")
        .factory("categoryService", Service);

})(angular);
