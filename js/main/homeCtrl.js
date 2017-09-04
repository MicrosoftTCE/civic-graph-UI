(function (angular) {

    "use strict";

    function Controller($scope, $q, _, utils, cgService, entityService, connectionService) {
        function wait(ms) {
            return $q(function(resolve) { setTimeout( resolve, ms ); });
        }

        var vm = this;

        vm.currentEntity = null;
        vm.isMobile = cgService.mobileCheck();

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
        $scope.settingsEnabled = !vm.isMobile;

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
                console.log("Current entity in Home Controller updated!");
                vm.currentEntity = n;
            }
        );
        $scope.$on("editEntitySuccess", onEditEntitySuccess);

        // Leaving here for testing reasons.  The wait method isn't actually necessary, but useful
        // if you don't have a lot of data in the database and need to simulate a large request.
        // The $q.all() is necessary though, so if you remove wait(), leave the $q.all()
        wait(1000)
            .then(function () {
                return $q.all([entityService.getAll(), connectionService.getAll()]);
            })
            .then(function (responseList) {
                cgService.setEntityList(responseList[0].nodes);
                $scope.searchItems = responseList[0].nodes;

                cgService.setConnectionObj(responseList[0].connections);

                $scope.$broadcast("cg.data-loaded");
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
            if (vm.isMobile) {
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
            setEntity(_.find(cgService.getEntityList(), { 'id': id }));
        }

        function selectItem(item) {
            (utils.isObject(item) ? setEntity : setEntityID)(item);
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
        "$q",
        "_",
        "cgUtilService",
        "cgMainService",
        "entityService",
        "connectionService"
    ];

    angular.module("civic-graph")
        .controller("homeCtrl", Controller);

})(angular);
