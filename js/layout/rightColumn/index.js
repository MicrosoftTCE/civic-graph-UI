(function (angular) {

    "use strict";

    function Controller($scope, cgService) {
        var vm = this;

        vm.isMobile = cgService.mobileCheck();
        vm.emitStartCreateEntity = emitStartCreateEntity;
        vm.isEdit = cgService.getIsEdit;

        $scope.$on('cg.current-entity.update', function (event, args) { vm.currentEntity = args; });

        function emitStartCreateEntity () {
            cgService.startEdit();
        }

    }

    Controller.$inject = ["$scope", "cgMainService"];

    function Directive() {
        return {
            "restrict": "E",
            "templateUrl": "js/layout/rightColumn/rightColumn.template.html",
            "controller": Controller,
            "controllerAs": "right",
            "scope": {}
        };
    }

    angular
        .module("civic-graph")
        .directive("rightColumn", Directive);

})(angular, d3);
