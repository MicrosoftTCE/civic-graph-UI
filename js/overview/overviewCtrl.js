(function (angular) {

    "use strict";

    function filterByProperty(key, value) {
        return function (e) {
            return e[key] === value;
        };
    }

    function Controller($scope, entityService) {
        var entityTypes = entityService.getEntityTypes();

        $scope.categorizedEntities = {};

        $scope.$watch("entities", watchEntityList);

        function watchEntityList() {
            $scope.categorizedEntities = {};
            Object
                .keys(entityTypes)
                .forEach(function(type) {
                    $scope.categorizedEntities[type] = $scope.entities.filter(filterByProperty("type", type));
                });
        }
    }

    Controller.$inject = ["$scope", "entityService"];

    angular
        .module("civic-graph")
        .controller("overviewCtrl", Controller);
})(angular);
