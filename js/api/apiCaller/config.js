(function (angular) {

    "use strict";

    function Config($httpProvider) {
        $httpProvider.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
    }

    Config.$inject = ["$httpProvider"];

    angular.module("civic-graph.api").config(Config);

})(angular);
