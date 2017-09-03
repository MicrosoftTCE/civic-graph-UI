(function (angular) {

    "use strict";

    function filterByProperty(key, value) {
        return function (e) {
            return e[key] === value;
        };
    }

    function Controller($scope, entityService, cgService) {
        var entityTypes = entityService.getEntityTypes();

        $scope.categorizedEntities = {};
        $scope.updateCurrentEntity = updateCurrentEntity;

        $scope.$watch(cgService.getEntityList, watchEntityList);

        function updateCurrentEntity(entity) {
            cgService.currentEntity(entity);
        }

        function watchEntityList() {
            $scope.categorizedEntities = Object
                .keys(entityTypes)
                .reduce(function(result, type) {
                    var obj = {};
                    obj[type] = cgService.getEntityList().filter(filterByProperty("type", type));
                    return Object.assign({}, result, obj);
                }, {});
        }
    }

    Controller.$inject = ["$scope", "entityService", "cgMainService"];

    angular
        .module("civic-graph")
        .controller("overviewCtrl", Controller);
})(angular);
