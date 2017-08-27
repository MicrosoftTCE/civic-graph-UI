(function(angular) {

    'use strict';

    var mainDependencyList = [
        "ui.bootstrap",
        "leaflet-directive",
        "ngAnimate",
        "templateCache",
        "civic-graph.api",
        "civic-graph.util"
    ];

    var apiDependencyList = ["civic-graph.util"];

    angular.module("civic-graph.util", []);
    angular.module("civic-graph.api", apiDependencyList);
    angular.module("civic-graph", mainDependencyList);

})(angular);
