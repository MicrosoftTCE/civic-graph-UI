/**
 * Created by brianavecchione on 7/10/16.
 */

(function (angular) {

    'use strict';

    var controlDeps = [
        'entityService',
        'connectionService',
        '$rootScope',
        '_',
        '$modal',
        controlCtrl
    ];

    function controlCtrl(entityService, connectionService, $rootScope, _, $modal) {
        var vm = this;
        activate();

        function activate () {
            vm.entityTypes = entityService.getEntityTypes();
            vm.connectionTypes = connectionService.getConnectionTypes();
            vm.sizeByList = [
                {'name': 'Employees', 'value': 'employees'},
                {'name': 'Twitter Followers', 'value': 'followers'}
            ];
            vm.sizeBy = 'employees';
            vm.showView = {
                'Network': true,
                'Map': false
            };
            vm.changeView = changeView;
            vm.showAbout = showAbout;
            vm.toggleNode = toggleNode;
            vm.toggleLink = toggleLink;
            vm.changeSizeBy = changeSizeBy;
            vm.switchView = switchView;

            // Shitty situation where homeCtrl needs to know this, but won't update unless this is called
            changeSizeBy();
        }

        function changeView(view) {
            _.forEach(_.keys(vm.showView), function (name) {
                vm.showView[name] = view === name;
            });
            $rootScope.$broadcast('viewChange');
        }
        function showAbout() {
            $modal.open({
                animation: false,
                templateUrl: 'control/about.html',
                controller: 'modalCtrl'
            });
        }
        function toggleNode(type) {
            $rootScope.$broadcast('toggleNode', {'name': type, 'enabled': vm.entityTypes[type]
            });
        }
        function toggleLink(type) {
            $rootScope.$broadcast('toggleLink', {'name': type, 'enabled': vm.connectionTypes[type]
            });
        }
        function switchView() {
            changeView(!vm.toggleNetwork ? 'Map' : 'Network');
        }
        function changeSizeBy() {
            console.debug("Setting the sizeBy value to %O", vm.sizeBy);
            $rootScope.$broadcast('changeSizeBy', vm.sizeBy);
        }
    }

    angular.module('civic-graph')
        .controller('controlCtrl', controlDeps);

})(angular);
