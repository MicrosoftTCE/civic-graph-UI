(function (angular) {

    'use strict';

    function Controller($scope, _, entityService, connectionService, cgService) {
        var self = this;

        activate();

        function activate() {

            $scope.random                   = new Date().getTime();
            $scope.entities                 = [];
            $scope.searchItems              = null;
            $scope.categories               = [];
            $scope.currentLocation          = null;
            $scope.clickedLocation          = {};
            $scope.clickedLocation.location = null;
            $scope.clickedEntity            = {};
            $scope.clickedEntity.entity     = null;
            $scope.editing                  = false;
            $scope.actions                  = {'interacted': false};
            $scope.showsearchMB             = false;
            $scope.showAnalytics            = false;
            $scope.entityTypes              = entityService.getEntityTypes();
            $scope.connectionTypes          = connectionService.getConnectionTypes();
            $scope.status                   = {
                "isNetworkShown": true,
                "license"       : true,
                "networkLoading": true
            };
            $scope.mobile                   = cgService.mobileCheck();
            $scope.settingsEnabled          = !$scope.mobile;
            $scope.overviewUrl              = null;
            $scope.sizeBy                   = 'employees';

            self.minConnections = $scope.minConnections = 0;

            $scope.toggleAnalytics  = toggleAnalytics;
            $scope.connectionChange = connectionChange;
            $scope.hydePartials     = hydePartials;
            $scope.showSearch       = showSearch;
            $scope.toggleSettings   = toggleSettings;
            $scope.startEdit        = startEdit;
            $scope.setEntity        = setEntity;
            $scope.setEntityID      = setEntityID;
            $scope.setLocation      = setLocation;
            $scope.selectItem       = selectItem;
            $scope.setEntities      = setEntities;
            $scope.stopEdit         = stopEdit;

            $scope.$watch('minConnections', broadcastLoadEntities);

            $scope.$on('setCurrentEntity', updateCurrentEntity);

            $scope.$on('setCurrentLocation', updateCurrentLocation);

            $scope.$on("editEntitySuccess", editEntitySuccess);

            setTimeout(queryAPI, 100);
        }

        function broadcastLoadEntities() {
            $scope.$broadcast('entitiesLoaded');
        }

        function connectionChange() {
            $scope.minConnections = self.minConnections;
            $scope.$broadcast('entitiesLoaded');
        }

        function editEntitySuccess(response) {
            $scope.setEntities(response.nodes);
            // $scope.setEntityID($scope.currentEntity.id);
            $scope.$broadcast('entitiesLoaded');
        }

        function hydePartials(except) {
            if (except === "search") {
                $scope.editing         = false;
                $scope.settingsEnabled = false;
            } else if (except === "settings") {
                $scope.editing      = false;
                $scope.showsearchMB = false;
            } else if (except === "edit") {
                $scope.settingsEnabled = false;
                $scope.showsearchMB    = false;
            } else {
                $scope.editing         = false;
                $scope.settingsEnabled = false;
                $scope.showsearchMB    = false;
            }
        }

        function queryAPI() {
            entityService
                .getFromAPI()
                .then(function (data) {
                    $scope.entities = data.nodes;
                    var locations   = _.uniq(
                        _.pluck(_.flatten(_.pluck($scope.entities, 'locations')), 'locality'));

                    var entitiesByLocation = _.map(locations, function (loc) {
                        var findings = _.filter($scope.entities, _.flow(
                            _.property('locations'),
                            _.partialRight(_.any, {locality: loc})
                        ));

                        return {
                            name    : loc,
                            type    : 'location',
                            entities: findings,
                            dict    : _.zipObject(_.pluck(findings, 'name'),
                                                  _.pluck(findings, 'index'))
                        };
                    });

                    $scope.searchItems = entitiesByLocation.concat($scope.entities);

                    // if ($scope.getURLID()) {
                    //     // Set the entity to the ID in the URL if it exists.
                    //     $scope.setEntityID($scope.getURLID());
                    // }
                    $scope.overviewUrl = 'js/overview/overview.html?i=' + $scope.random;
                    $scope.$broadcast('entitiesLoaded');
                });
        }

        function selectItem(item) {
            if (item.type === 'location') {
                $scope.setLocation(item);
            }
            else {
                $scope[item % 1 === 0 ? 'setEntityID' : 'setEntity'](item);
            }
            $scope.$broadcast('selectItem', item);
        }

        function setEntity(entity) {
            $scope.currentLocation = null;
            $scope.currentEntity   = entity;
            if ($scope.editing) {
                $scope.stopEdit();
            }
            $scope.$broadcast('entityChange');
        }

        function setEntityID(id) {
            $scope.setEntity(_.find($scope.entities, {'id': id}));
        }

        function setEntities(entities) {
            $scope.entities = entities;
        }

        function setLocation(location) {
            $scope.currentLocation = location;
            if ($scope.editing) {
                $scope.stopEdit();
            }
            $scope.$broadcast('itemChange');
        }

        function showSearch() {
            $scope.hydePartials("search");
            $scope.showsearchMB  = !$scope.showsearchMB;
            // $scope.$broadcast('hideLicense');
            $scope.status.license = false;
        }

        function startEdit(entity) {
            $scope.currentEntity = entity;
            if ($scope.mobile) {
                $scope.hydePartials("edit");
            }
            $scope.editing = true;
        }

        function stopEdit() {
            $scope.editing = false;
        }

        function toggleAnalytics() {
            $scope.showAnalytics = !$scope.showAnalytics;
        }

        function toggleSettings() {
            $scope.hydePartials("settings");
            $scope.settingsEnabled = !$scope.settingsEnabled;
        }

        function updateCurrentEntity(event, args) {
            $scope.currentEntity = args.value;
        }

        function updateCurrentLocation(event, args) {
            $scope.currentLocation = args.value;
        }
    }

    Controller.$inject = [
        '$scope',
        '_',
        'entityService',
        'connectionService',
        "CivicGraphService"
    ];

    angular.module('civic-graph')
        .controller('homeCtrl', Controller);

})(angular);
