/**
 * Created by brianavecchione on 7/10/16.
 */

(function (angular) {

    'use strict';

    var controlDependencies = [controlDirective];

    function controlDirective() {
        return {
            templateUrl: '/js/control/controls.html',
            restrict   : 'E',
            scope      : {},
            controller   : 'controlCtrl',
            controllerAs : 'control',
            bindToController : {
                minConnections : "=",
                toggleNetwork : '='
            }
        };
    }

    angular.module('civic-graph')
        .directive('control', controlDependencies);

})(angular);
