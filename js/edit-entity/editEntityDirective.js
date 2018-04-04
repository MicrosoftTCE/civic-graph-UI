/**
 *
 * Created by brianavecchione on 6/27/16.
 */

(function (angular) {

    'use strict';

    var editEntityDependencies = [editEntityDirective];

    function editEntityDirective() {
        return {
            templateUrl: 'js/edit-entity/editdisabled.html',
            restrict   : 'E',
            scope      : {
                'entity'  : "=",
                'entities': "=",
                'isOpen'  : "="
            },
            controller : 'editCtrl'
        };
    }

    angular.module('civic-graph')
        .directive('editEntity', editEntityDependencies);

})(angular);
