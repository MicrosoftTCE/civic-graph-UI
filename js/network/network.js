(function (angular) {

    "use strict";

    function Controller(scope) {
        scope.isLoading = true;

        scope.$on("cg.data-loaded", function () { scope.isLoading = false; });
    }

    Controller.$inject = ["$scope"];

    function Directive() {
        return {
            "restrict": "E",
            "templateUrl": "js/network/network.template.html",
            "controller": Controller,
            "scope": {}
        };
    }

    angular
        .module("civic-graph.network")
        .directive("network", Directive);

})(angular, d3);
