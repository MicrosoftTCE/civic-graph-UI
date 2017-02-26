/**
 * Created by brianavecchione on 6/27/16.
 */
(function (angular) {

    'use strict';

    var connectionService = [
        '$http',
        '$q',
        'config',
        Connections
    ];

    var connectionTypes = {
        'Funding': true,
        'Data': true,
        'Employment': true,
        'Collaboration': true
    };

    function isDef(o) {
        return o !== undefined && o !== null;
    }

    function Connections($http, $q, config) {
        function Connection(obj) {
            var objIsDef = isDef(obj);
            this.entity = (objIsDef && isDef(obj.entity) ? obj.entity : null);
            this.id = (objIsDef && isDef(obj.id) ? obj.id : null);
            this.details = (objIsDef && isDef(obj.details) ? obj.details : null);
            this.name = (objIsDef && isDef(obj.name) ? obj.name: null);
            this.entity_id = (objIsDef && isDef(obj.entity_id) ? obj.entity_id: null);
        }

        function getConnectionModel(obj) {
            return new Connection(obj);
        }

        function getConnectionTypes() {
            return connectionTypes;
        }

        function getFromAPI() {
            // return $http.get(config.apiHost + 'api/connections');
            var deferred = $q.defer();
            deferred.resolve(
                {
                    "connections": {
                        "Collaboration": [],
                        "Data": [],
                        "Employment": [],
                        "Funding": [],
                        "Relation": []
                    }
                }
            );
            return deferred.promise;
        }

        return {
            "getConnectionModel" : getConnectionModel,
            "getConnectionTypes" : getConnectionTypes,
            "getFromAPI" : getFromAPI
        };
    }


    angular.module('civic-graph')
        .service('connectionService', connectionService);

})(angular);