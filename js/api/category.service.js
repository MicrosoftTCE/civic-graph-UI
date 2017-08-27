/**
 * Created by brianavecchione on 6/28/16.
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

    function Category(obj) {
        var getProperty = getPropertyFromObj(obj);

        this.id = getProperty("id");
        this.name = getProperty("name");
        this.enabled = getProperty("enable", true);
    }

    function Service(apiCaller) {
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

    Service.$inject = ["cgApiCaller"];

    angular
        .module("civic-graph.api")
        .factory("categoryService", Service);

})(angular);