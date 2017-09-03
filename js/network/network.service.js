(function (angular) {
    "use strict";

    // Sloppy function, returns a filter function that filters based on the value in the
    // map, with the key chosen being the type property in the object
    function filterByBooleanMap(map) {
        return function(v) {
            return map[v.type];
        };
    }

    function filterByMinConnection(minConnection) {
        return function (entity) {
            return entity.value.collaborations.length >= minConnection;
        };
    }

    function convertEntityToGraphNode(entity) {
        return {
            "id": entity.id,
            "value": entity
        };
    }

    function findById(findThis) {
        return function (d) {
            return d.id === findThis;
        };
    }

    /**
     * @param {object} _ - Lodash
     * @param {CgUtilService} utils
     * @param {CgEntityService} entityService
     * @param {Object} connectionService
     * @constructor
     */
    function Service(_, utils, entityService, connectionService) {
        var self = this;
        var entityList = [];
        var connectionObj = {};

        var _minConnection = 0;
        var _sizeBy = "employees";

        function setEntityList(a) {
            if (Array.isArray(a)) {
                entityList = a;
            }

            return self;
        }

        function setConnectionObj(a) {
            if (utils.isObject(a)) {
                connectionObj = a;
            }

            return self;
        }

        function sizeBy(o) {
            if(utils.isString(o)) {
                _sizeBy = o;
            }

            return _sizeBy;
        }

        function minConnection(o) {
            if(isFinite(o) && o >= 0) {
                _minConnection = o;
            }

            return _minConnection;
        }

        function getGraphNodeList() {
            if (!Array.isArray(entityList)) {
                return [];
            }

            return entityList
                .filter(filterByBooleanMap(entityService.getEntityTypes()))
                .map(convertEntityToGraphNode)
                .filter(filterByMinConnection(_minConnection));
        }

        function getGraphLinkList() {
            var nodeList = getGraphNodeList().map(function (d) { return d.value; });

            function buildConnectionObject(key) {
                var connections = connectionObj[key];
                return connections
                    .map(function (connection) {
                        var sourceNode = nodeList.findIndex(findById(connection.source));
                        var targetNode = nodeList.findIndex(findById(connection.target));
                        return { "source": sourceNode, "target": targetNode, type: key };
                    })
                    .filter(utils.isDefined);
            }

            function filterConnectionWithMissingEntity(connection) {
                function checkProperty(prop) {
                    return utils.isDefined(connection[prop]) && connection[prop] !== -1;
                }
                return checkProperty("source") && checkProperty("target");
            }

            function reduceArrayOfArray(arr, d) {
                return arr.concat(d);
            }

            return Object
                .keys(connectionObj)
                .map(buildConnectionObject)
                .reduce(reduceArrayOfArray, [])
                .filter(filterConnectionWithMissingEntity)
                .filter(filterByBooleanMap(connectionService.getConnectionTypes()));
        }

        self.setEntityList = setEntityList;
        self.setConnectionObj = setConnectionObj;

        self.getGraphNodeList = getGraphNodeList;
        self.getGraphLinkList = getGraphLinkList;

        self.sizeBy = sizeBy;
        self.minConnection = minConnection;
    }

    Service.$inject = [
        "_",
        "cgUtilService",
        "entityService",
        "connectionService"
    ];

    angular
        .module("civic-graph.network")
        .service("cgNetworkService", Service);

})(angular);
