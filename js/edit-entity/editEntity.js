(function (angular) {

    'use strict';

    function Controller ($scope, $http, $timeout, _, cgService, entityService, categoryService, locationService, utils) {
        var categoryBackup;

        activate();

        function activate () {
            $scope.isEditing = utils.isDefined(cgService.getCurrentEntity());
            $scope.entities = cgService.getEntityList();
            $scope.editEntity = entityService.getEntityModel(cgService.getCurrentEntity());
            $scope.entityTypes = entityService.getEntityTypes();
            $scope.influenceTypes = entityService.getInfluenceTypes();
            $scope.categories = [];

            // Retrieve Categories from DB
            if ( !categoryBackup ) {
                categoryService
                    .getAll()
                    .then(function (data) {
                        categoryBackup = data.categories;
                        // Creates backup of data using Angular to prevent api data from being tampered
                        // directly
                        $scope.categories = angular.copy(categoryBackup);

                        initCategoryArray();
                    });
            }
            else {
                $scope.categories = categoryBackup;
                initCategoryArray();
            }
        }

        $scope.$on('cg.current-entity.update', activate);

        $scope.addressSearch = addressSearch;
        $scope.toggleCategory = toggleCategory;
        $scope.setLocation = setLocation;
        $scope.addLocation = addLocation;
        $scope.addKeyPerson = addKeyPerson;
        $scope.setFundingConnection = setFundingConnection;
        $scope.addFundingConnection = addFundingConnection;
        $scope.setConnection = setConnection;
        $scope.addConnection = addConnection;
        $scope.addFinance = addFinance;
        $scope.save = save;
        $scope.cancelEdit = cancelEdit;

        function addressSearch (search) {
            return $http.jsonp('https://dev.virtualearth.net/REST/v1/Locations', {
                params: {
                    query: search,
                    key: 'Ai58581yC-Sr7mcFbYTtUkS3ixE7f6ZuJnbFJCVI4hAtW1XoDEeZyidQz2gLCCyD',
                    'jsonp': 'JSON_CALLBACK',
                    'include': 'ciso2'
                }
            })
                        .then(function (response) {
                            if ( utils.isDefined(response.data.resourceSets) && response.data.resourceSets.length
                                                                                > 0 ) {
                                return response.data.resourceSets[ 0 ].resources;
                            }
                        });
        }

        function toggleCategory (category) {
            if ( $scope.editEntity.categories.length === 0 ) {
                $scope.editEntity.categories.push(category);
            }
            else {
                var found = false;

                for ( var categoryIndex in $scope.editEntity.categories ) {
                    if ( !$scope.editEntity.categories.hasOwnProperty(categoryIndex) ) {
                        continue;
                    }
                    var entityCategory = $scope.editEntity.categories[ categoryIndex ];
                    if ( entityCategory.id === category.id ) {
                        found = true;
                        entityCategory.enabled = category.enabled;
                        break;
                    }
                }
                if ( !found ) {
                    $scope.editEntity.categories.push(category);
                }
            }
        }

        function setLocation (location, isLast) {
            addressSearch(location.formattedAddress)
                .then(function (apiCallResult) {
                    if ( !utils.isDefined(apiCallResult[ 0 ]) ) {
                        return;
                    }
                    var result  = apiCallResult[ 0 ],
                        address = result.address,
                        point   = result.point;
                    addLocation(isLast);

                    // Parses API call result
                    location.address_line = utils.isDefined(address.addressLine) ? address.addressLine : '';
                    location.locality = utils.isDefined(address.locality) ? address.locality : '';
                    location.district =
                        utils.isDefined(address.adminDistrict) ? address.adminDistrict : '';
                    location.country =
                        utils.isDefined(address.countryRegion) ? address.countryRegion : null;
                    location.country_code =
                        utils.isDefined(address.countryRegionIso2) ? address.countryRegionIso2 : '';
                    location.coordinates = utils.isDefined(point.coordinates) ? point.coordinates : null;
                    location.postal_code = utils.isDefined(address.postalCode) ? address.postalCode : null;
                });
        }

        function addLocation (isLast) {
            if ( isLast ) {
                $scope.editEntity.locations.push(locationService.getLocationModel());
            }
        }

        function addKeyPerson () {
            // Add blank field to edit if there are none.
            // WATCH OUT! TODO: If someone deletes an old person, delete their id too.
            // i.e. make sure old/cleared form fields aren't being edited into new people.
            if ( !(_.some($scope.editEntity.key_people, { 'name': '', 'id': null })) ) {
                $scope.editEntity.key_people.push({ 'name': '', 'id': null });
            }
        }

        function setFundingConnection (entity, funding) {
            // Add other entity's id to this finance connection.
            funding.entity_id = entity.id;
        }

        function addFundingConnection (funding) {
            if ( !_.some(funding, { 'entity': '' }) ) {
                // Maybe set amount to 0 instead of null?
                funding.push({ 'entity': '', 'amount': null, 'year': null, 'id': null });
            }
        }

        function setConnection (entity, connection) {
            connection.entity_id = entity.id;
        }

        function addConnection (connections) {
            // Add an empty connection to edit if none exist.
            if ( !_.some(connections, { 'entity': '', 'id': null }) ) {
                connections.push({ 'entity': '', 'id': null, 'details': null });
            }
        }

        function addFinance (records) {
            // Add new finance field if all current fields are valid.
            if ( _.every(records, function (r) {
                    return r.amount > 0 && r.year > 1750;
                }) ) {
                records.push({ 'amount': null, 'year': null, 'id': null });
            }
        }

        function save () {
            $scope.isSaving = true;

            function success (response) {
                $scope.isSaving = false;
                $scope.$emit('editEntitySuccess', response);
                cancelEdit();
            }

            function error () {
                $scope.isError = true;
                $timeout(function () {
                    $scope.isError = false;
                }, 2000);
            }

            entityService
                .saveEntity($scope.editEntity.generateDBModel())
                .then(success, error);
        }

        function cancelEdit () {
            cgService.stopEdit();
        }

        /**
         * Initializes category fields with entity values.
         *
         * Loops through category in categories and loops through category in entity. Identifies
         * categories enabled in the entity and sets local display data. This is because we created
         * a backup of entity data so that the api data is not tampered with directly.
         *
         * TODO: replace with better data structure for categories.
         */
        function initCategoryArray () {
            var category,
                categoryIndex,
                entityCategoryIndex,
                entityCategory;

            for ( categoryIndex in $scope.categories ) {
                if ( !$scope.categories.hasOwnProperty(categoryIndex) ) {
                    continue;
                }
                category = $scope.categories[ categoryIndex ];
                for ( entityCategoryIndex in $scope.editEntity.categories ) {
                    if ( !$scope.editEntity.categories.hasOwnProperty(entityCategoryIndex) ) {
                        continue;
                    }
                    entityCategory = $scope.editEntity.categories[ entityCategoryIndex ];
                    if ( category.id === entityCategory.id ) {
                        category.enabled = entityCategory.enabled;
                    }
                }
            }
        }
    }

    Controller.$inject = [
        '$scope',
        '$http',
        '$timeout',
        '_',
        'cgMainService',
        'entityService',
        'categoryService',
        'locationService',
        'cgUtilService'
    ];

    function Directive () {
        return {
            restrict: 'E',
            templateUrl: 'js/edit-entity/editEntity.template.html',
            controller: Controller,
            scope: {}
        };
    }

    angular
        .module('civic-graph')
        .directive('editEntity', Directive);

})(angular);
