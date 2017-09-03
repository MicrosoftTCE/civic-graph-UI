(function (angular) {

    "use strict";

    function Controller($scope, _, cgService, entityService, networkService) {
        var vm = this;

        vm.currentEntity = null;

        $scope.entities = [];
        $scope.searchItems = null;
        $scope.clickedEntity = { entity: null };
        $scope.editing = false;
        $scope.actions = { 'interacted': false };
        $scope.showsearchMB = false;
        $scope.status = {
            "isNetworkShown": true,
            "license": true,
            "networkLoading": true
        };
        $scope.mobile = cgService.mobileCheck();
        $scope.settingsEnabled = !$scope.mobile;

        $scope.showSearch = showSearch;
        $scope.toggleSettings = toggleSettings;
        $scope.startEdit = startEdit;
        $scope.switchView = switchView;
        $scope.setEntity = setEntity;
        $scope.setEntityID = setEntityID;
        $scope.selectItem = selectItem;

        $scope.$watch(
            function () {
                return cgService.currentEntity();
            },
            function (n) {
                vm.currentEntity = n;
            }
        );
        $scope.$on("editEntitySuccess", onEditEntitySuccess);

        entityService
            .getAll()
            .then(function (data) {
                $scope.entities = data.nodes;
                $scope.searchItems = data.nodes;
                networkService.setEntityList(data.nodes);
            });

        function hydePartials(except) {
            if (except === "search") {
                $scope.editing = false;
                $scope.settingsEnabled = false;
            } else if (except === "settings") {
                $scope.editing = false;
                $scope.showsearchMB = false;
            } else if (except === "edit") {
                $scope.settingsEnabled = false;
                $scope.showsearchMB = false;
            } else {
                $scope.editing = false;
                $scope.settingsEnabled = false;
                $scope.showsearchMB = false;
            }

        }

        function showSearch() {
            hydePartials("search");
            $scope.showsearchMB = !$scope.showsearchMB;
            // $scope.$broadcast('hideLicense');
            $scope.status.license = false;
        }

        function toggleSettings() {
            hydePartials("settings");
            $scope.settingsEnabled = !$scope.settingsEnabled;
        }

        function startEdit(entity) {
            cgService.currentEntity(entity);
            if ($scope.mobile) {
                hydePartials("edit");
            }
            $scope.editing = true;
        }

        function switchView() {
            $scope.status.isNetworkShown = !$scope.status.isNetworkShown;
            if ($scope.status.isNetworkShown) {
                $scope.$broadcast('triggerNetworkDraw');
            }
        }

        function setEntity(entity) {
            cgService.currentEntity(entity);

            if ($scope.editing) {
                stopEdit();
            }
        }

        function setEntityID(id) {
            setEntity(_.find($scope.entities, { 'id': id }));
        }

        function selectItem(item) {
            var fn = (item % 1 === 0 ? setEntityID : setEntity);

            fn(item);
            $scope.$broadcast('selectItem', item);
        }

        function setEntities(entities) {
            $scope.entities = entities;
        }

        function stopEdit() {
            $scope.editing = false;
        }

        function onEditEntitySuccess(response) {
            setEntities(response.nodes);
            $scope.$broadcast('triggerNetworkDraw');
        }
    }

    Controller.$inject = [
        "$scope",
        "_",
        "cgMainService",
        "entityService",
        "cgNetworkService"
    ];

    angular.module("civic-graph")
        .controller("homeCtrl", Controller);

})(angular);
