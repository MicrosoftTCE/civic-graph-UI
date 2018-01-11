(function (angular) {

    "use strict";

    function Controller(scope, cgService) {
        var vm = this;

        vm.isLoading = true;
        vm.getCurrentView = cgService.getCurrentView;
        vm.isMobile = cgService.mobileCheck();

        scope.$on("cg.data-loaded", function () {
            vm.isLoading = false;
        });
    }

    Controller.$inject = ["$scope", "cgMainService"];

    function Directive() {
        return {
            "restrict": "E",
            "templateUrl": "js/layout/centralColumn/centralColumn.template.html",
            "controller": Controller,
            "controllerAs": "central",
            "scope": {}
        };
    }

    angular
        .module("civic-graph")
        .directive("centralColumn", Directive);

})(angular, d3);
