(function (angular) {

    'use strict';

    function filterByProperty (key, value) {
        return function (e) {
            return e[ key ] === value;
        };
    }

    function Controller ($scope, entityService, cgService) {
        var entityTypes = entityService.getEntityTypes();

        $scope.categorizedEntities = {};

        $scope.updateCurrentEntity = updateCurrentEntity;

        $scope.$watch(cgService.getEntityList, watchEntityList);

        function updateCurrentEntity (entity) { cgService.setCurrentEntity(entity); }

        function watchEntityList () {
            $scope.categorizedEntities = Object
                .keys(entityTypes)
                .reduce(function (result, type) {
                    var obj = {};
                    obj[ type ] = cgService.getEntityList().filter(filterByProperty('type', type));
                    return Object.assign({}, result, obj);
                }, {});
        }
    }

    Controller.$inject = [ '$scope', 'entityService', 'cgMainService' ];

    function Directive() {
        return {
            restrict: 'E',
            templateUrl: 'js/overview/overview.template.html',
            controller: Controller
        };
    }

    angular
        .module('civic-graph')
        .directive('cgOverviewPane', Directive);
        // .controller("overviewCtrl", Controller);

})(angular);
