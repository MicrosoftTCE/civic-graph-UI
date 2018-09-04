/**
 * Created by brianavecchione on 7/1/16.
 */


(function (angular) {

    'use strict';

    var analyticsDependencies = [analyticsDirective];

    function analyticsDirective(){
        return {
            // templateUrl: 'js/analytic/analytics.html',
            templateUrl: 'https://msit.powerbi.com/view?r=eyJrIjoiNDRmNzc4NjYtMWM2OS00NGFkLWI1MDctY2FhY2IwNzcyN2I5IiwidCI6IjcyZjk4OGJmLTg2ZjEtNDFhZi05MWFiLTJkN2NkMDExZGI0NyIsImMiOjV9',
            restrict   : 'E',
            scope      : {},
            controller   : 'analyticsCtrl'
        };
    }

    angular.module('civic-graph')
        .directive('analytics', analyticsDependencies);

})(angular);
