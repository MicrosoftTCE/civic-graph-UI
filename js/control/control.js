/**
 * Created by brianavecchione on 7/10/16.
 */

(function (angular) {

    "use strict";

    function Controller($rootScope, $modal, _, cgService, networkService, entityService, connectionService) {
        var vm = this;

        vm.entityTypes = entityService.getEntityTypes();
        vm.connectionTypes = connectionService.getConnectionTypes();
        vm.currentView = cgService.getCurrentView();

        vm.sizeBy = networkService.sizeBy();
        vm.minConnection = networkService.minConnection();

        vm.sizeByList = [
            { "name": "Employees", "value": "employees" },
            { "name": "Twitter Followers", "value": "followers" }
        ];

        vm.changeMinConnection = function () {
            networkService.minConnection(vm.minConnection);
        };

        vm.changeView = function () {
            cgService.setCurrentView(vm.currentView);
        };

        vm.showAbout = function () {
            $modal.open({
                animation: false,
                templateUrl: "control/about.html",
                controller: "modalCtrl"
            });
        };

        vm.toggleLink = function (type) {
            $rootScope.$broadcast("toggleLink", {
                "name": type, "enabled": vm.connectionTypes[type]
            });
        };

        vm.changeSizeBy = function () {
            networkService.sizeBy(vm.sizeBy);
        };
    }

    Controller.$inject = [
        "$rootScope",
        "$uibModal",
        "_",
        "cgMainService",
        "cgNetworkService",
        "entityService",
        "connectionService"
    ];

    function Directive() {
        return {
            templateUrl: "js/control/control.template.html",
            restrict   : "E",
            scope      : {
                toggleNetwork : "="
            },
            controller   : Controller,
            controllerAs : "control",
            bindToController : true
        };
    }

    angular
        .module("civic-graph")
        .directive("control", Directive);

})(angular);
