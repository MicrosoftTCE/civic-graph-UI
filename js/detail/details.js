(function (angular) {

    'use strict';

    function getItemsShownDefault () {
        return {
            'key_people': 3,
            'grants_given': 3,
            'grants_received': 3,
            'investments_made': 3,
            'investments_received': 3,
            'collaborations': 3,
            'employments': 3,
            'relations': 3,
            'data_given': 3,
            'data_received': 3,
            'revenues': 3,
            'expenses': 3
        };
    }

    function Controller ($scope, cgService, utils, _) {
        $scope.isMobile = cgService.mobileCheck();
        $scope.itemsShownDefault = getItemsShownDefault();
        $scope.itemsShown = getItemsShownDefault();
        $scope.currentEntity = cgService.getCurrentEntity();

        $scope.emitStartEditEvent = emitStartEditEvent;
        $scope.showMore = showMore;
        $scope.showLess = showLess;
        $scope.selectItem = selectItem;

        $scope.$on('cg.current-entity.update', function (event, args) { onCurrentEntityUpdate(args); });

        function emitStartEditEvent (entity) {
            cgService.startEdit(entity);
        }

        function showMore (type) {
            $scope.itemsShown[ type ] = cgService.getCurrentEntity()[ type ].length;
        }

        function showLess (type) {
            $scope.itemsShown[ type ] = $scope.itemsShownDefault[ type ];
        }

        function onCurrentEntityUpdate (currentEntity) {
            $scope.currentEntity = currentEntity;
            // Reset items shown in details list.
            $scope.itemsShown = getItemsShownDefault();
        }

        function selectItem (item) {
            cgService.setCurrentEntity(
                utils.isObject(item)
                    ? item
                    : _.find(cgService.getEntityList(), { 'id': item })
            );
        }

    }

    Controller.$inject = [ '$scope', 'cgMainService', 'cgUtilService', '_' ];

    function Directive () {
        return {
            restrict: 'E',
            templateUrl: 'js/detail/details.template.html',
            controller: Controller
        };
    }

    angular
        .module('civic-graph')
        .directive('cgDetailPane', Directive);
    // .controller("detailsCtrl", Controller);

})(angular);
