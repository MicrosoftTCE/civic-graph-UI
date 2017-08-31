(function (angular) {

    "use strict";

     var apiUrl = "https://api.civicgraph.io/api";
    // var apiUrl = "/api";

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

        function post(url, data) {
            return $http
                .post(apiUrl + url, data, { "headers": defaultHeader })
                .then(unwrapAngularHttp, logApiError);
        }

        return {
            "get": get,
            "post": post
        };
    }

    Service.$inject = ["$http", "$q"];

    angular.module("civic-graph.api").factory("cgApiCaller", Service);

})(angular);
