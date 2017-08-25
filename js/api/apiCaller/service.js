(function (angular) {

    "use strict";

    var apiUrl = "https://api.civicgraph.io/";
    // var apiUrl = "http://localhost:8888/api";

    var defaultHeader = {
        // "Event-Name": "Test-Event"
    };

    function Service($http, $q) {
        function logApiError(err) {
            console.error("Recieved an error from API with this message: %O", err.data);
            return $q.reject(err);
        }

        function unwrapAngularHttp(response) {
            return response.data;
        }

        function get(url, params) {
            return $http
                .get(apiUrl + url, { "params": params, "headers": defaultHeader })
                .then(unwrapAngularHttp, logApiError);
        }

        return {
            "get": get
        };
    }

    Service.$inject = ["$http", "$q"];

    angular.module("civic-graph.api").factory("cgApiCaller", Service);

})(angular);
