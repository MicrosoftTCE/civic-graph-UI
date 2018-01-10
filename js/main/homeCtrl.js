(function (angular) {

    'use strict';

    function Controller ($scope, $q, _, utils, cgService, entityService, connectionService) {
        function wait (ms) {
            return $q(function (resolve) { setTimeout(resolve, ms); });
        }

        var vm = this;

        // For the search bar
        vm.currentEntity = null;

        vm.isMobile = cgService.mobileCheck();

        vm.isEdit = cgService.getIsEdit;

        $scope.searchItems = null;
        $scope.clickedEntity = { entity: null };
        $scope.showsearchMB = false;
        $scope.status = {
            'isNetworkShown': true,
            'license': true,
            'networkLoading': true
        };
        $scope.settingsEnabled = !vm.isMobile;

        $scope.showSearch = showSearch;
        $scope.toggleSettings = toggleSettings;
        $scope.startEdit = startEdit;
        $scope.switchView = switchView;
        $scope.setEntity = setEntity;
        $scope.setEntityID = setEntityID;
        $scope.selectItem = selectItem;

        $scope.$on('cg.current-entity.update', function (event, args) { onCurrentEntityUpdate(args); });
        $scope.$on('editEntitySuccess', onEditEntitySuccess);
        $scope.$on('cg.start-edit', startEdit);

        // Leaving here for testing reasons.  The wait method isn't actually necessary, but useful
        // if you don't have a lot of data in the database and need to simulate a large request.
        // The $q.all() is necessary though, so if you remove wait(), leave the $q.all()
        wait(1000)
            .then(function () {
                return $q.all([ entityService.getAll(), connectionService.getAll() ]);
            })
            .then(function (responseList) {
                cgService.setEntityList(responseList[ 0 ].nodes);
                $scope.searchItems = responseList[ 0 ].nodes;

                cgService.setConnectionObj(responseList[ 0 ].connections);

                $scope.$broadcast('cg.data-loaded');
            });

        function hydePartials (except) {
            switch (except) {
                case 'search':
                    cgService.setIsEdit(false);
                    $scope.settingsEnabled = false;
                    break;
                case 'settings':
                    cgService.setIsEdit(false);
                    $scope.showsearchMB = false;
                    break;
                case 'edit':
                    $scope.settingsEnabled = false;
                    $scope.showsearchMB = false;
                    break;
                default:
                    cgService.setIsEdit(false);
                    $scope.settingsEnabled = false;
                    $scope.showsearchMB = false;
            }

        }

        function showSearch () {
            hydePartials('search');
            $scope.showsearchMB = !$scope.showsearchMB;
            // $scope.$broadcast('hideLicense');
            $scope.status.license = false;
        }

        function toggleSettings () {
            hydePartials('settings');
            $scope.settingsEnabled = !$scope.settingsEnabled;
        }

        function startEdit (entity) {
            cgService.setCurrentEntity(entity);
            if ( vm.isMobile ) {
                hydePartials('edit');
            }
            cgService.setIsEdit(true);
        }

        function switchView () {
            $scope.status.isNetworkShown = !$scope.status.isNetworkShown;
            if ( $scope.status.isNetworkShown ) {
                $scope.$broadcast('triggerNetworkDraw');
            }
        }

        function setEntity (entity) {
            cgService.setCurrentEntity(entity);

            if ( vm.isEdit() ) {
                stopEdit();
            }
        }

        function setEntityID (id) {
            setEntity(_.find(cgService.getEntityList(), { 'id': id }));
        }

        function selectItem (item) {
            (utils.isObject(item) ? setEntity : setEntityID)(item);
        }

        function setEntities (entities) {
            $scope.entities = entities;
        }

        function stopEdit () { cgService.setIsEdit(false); }

        function onEditEntitySuccess (response) {
            setEntities(response.nodes);
            $scope.$broadcast('triggerNetworkDraw');
        }

        function onCurrentEntityUpdate (currentEntity) {
            vm.currentEntity = currentEntity;
        }
    }

    Controller.$inject = [
        '$scope',
        '$q',
        '_',
        'cgUtilService',
        'cgMainService',
        'entityService',
        'connectionService'
    ];

    angular.module('civic-graph')
           .controller('homeCtrl', Controller);

})(angular);
