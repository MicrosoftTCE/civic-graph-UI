(function(angular) {

    'use strict';

    var mainDependencies = [
        'ui.bootstrap',
        'leaflet-directive',
        'ngAnimate',
        'mscg.network.graph',
        "mscg.app.service"
    ];

    var networkGraphDependencyList = [
        "mscg.app.service"
    ];

    var appServiceDependencyList = [];

    angular.module("mscg.app.service", appServiceDependencyList);

    angular.module('mscg.network.graph', networkGraphDependencyList);

    angular.module('civic-graph', mainDependencies);

})(angular);
