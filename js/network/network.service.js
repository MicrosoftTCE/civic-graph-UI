(function (angular) {

    "use strict";

    var dependencyList = [
        Factory
    ];

    function Factory() {



        function NetworkService() {
        }



        function getInstance(o) {
            return new NetworkService(o);
        }

        return {
            "getInstance": getInstance
        };
    }

    angular.module('mscg.network.graph')
        .factory('MSCGNetworkService', dependencyList);

})(angular);
