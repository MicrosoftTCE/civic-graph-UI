(function(angular) {

    'use strict';

    var mainDependencies = [
        'ui.bootstrap',
        'leaflet-directive',
        'ngAnimate',
        'templateCache',
        'civic-graph.api'
    ];

    angular.module('civic-graph.api', []);
    angular.module('civic-graph', mainDependencies);

})(angular);
