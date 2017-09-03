/**
 * Created by brianavecchione on 7/10/16.
 */

(function (angular) {

    "use strict";

    function Controller($rootScope, $modal, _, networkService, entityService, connectionService) {
        var vm = this;

        vm.entityTypes = entityService.getEntityTypes();
        vm.connectionTypes = connectionService.getConnectionTypes();
        vm.sizeByList = [
            { "name": "Employees", "value": "employees" },
            { "name": "Twitter Followers", "value": "followers" }
        ];
        vm.showView = {
            "Network": true,
            "Map": false
        };

        vm.sizeBy = networkService.sizeBy();
        vm.minConnection = networkService.minConnection();

        vm.changeMinConnection = function () {
            networkService.minConnection(vm.minConnection);
        };
        vm.switchView = function () {
            vm.changeView(!vm.toggleNetwork ? 'Map' : 'Network');
        };
        vm.changeView = function (view) {
            _.forEach(_.keys(vm.showView), function (name) {
                vm.showView[name] = view === name;
            });
            $rootScope.$broadcast('viewChange', vm.showView);
        };
        vm.showAbout = function () {
            $modal.open({
                animation: false,
                templateUrl: 'control/about.html',
                controller: 'modalCtrl'
            });
        };
        vm.toggleNode = function (type) {
            $rootScope.$broadcast('toggleNode', {
                'name': type, 'enabled': vm.entityTypes[type]
            });
        };
        vm.toggleLink = function (type) {
            $rootScope.$broadcast('toggleLink', {
                'name': type, 'enabled': vm.connectionTypes[type]
            });
        };
        vm.changeSizeBy = function () {
            $rootScope.$broadcast('changeSizeBy', vm.sizeBy);
        };

        // Necessary because we don't properly set defaults across the board
        vm.changeSizeBy();
    }

    Controller.$inject = [
        "$rootScope",
        "$uibModal",
        "_",
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
