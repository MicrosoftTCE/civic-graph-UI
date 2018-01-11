(function(angular) {

    'use strict';

    var mainDependencyList = [
        "ui.bootstrap",
        "leaflet-directive",
        "ngAnimate",
        "templateCache",
        "civic-graph.util",
        "civic-graph.api",
        "civic-graph.network"
    ];

    var apiDependencyList = ["civic-graph.util"];

    var networkDependencyList = [
        "civic-graph.util",
        "civic-graph.api"
    ];

    angular.module("civic-graph.util", []);
    angular.module("civic-graph.api", apiDependencyList);
    angular.module("civic-graph.network", networkDependencyList);
    angular.module("civic-graph", mainDependencyList);

})(angular);
