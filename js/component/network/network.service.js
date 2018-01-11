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

    function Service(utils, cgService, entityService, connectionService) {
        var self = this;

        var _minConnection = 5;
        var _sizeBy = "employees";

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

        function getGraphNodeList(entityList) {
            if (!Array.isArray(entityList)) {
                return [];
            }

            return entityList
                .filter(filterByBooleanMap(entityService.getEntityTypes()))
                .map(convertEntityToGraphNode)
                .filter(filterByMinConnection(_minConnection));
        }

        function getGraphLinkList(nodeList, connectionObj) {
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

        function getGraphData() {
            var connectionObj = cgService.getConnectionObj();
            var nodeList = getGraphNodeList(cgService.getEntityList());

            return { "nodeList": nodeList, "linkList": getGraphLinkList(nodeList, connectionObj) };
        }

        self.getGraphData = getGraphData;

        self.sizeBy = sizeBy;
        self.minConnection = minConnection;
    }

    Service.$inject = [
        "cgUtilService",
        "cgMainService",
        "entityService",
        "connectionService"
    ];

    angular
        .module("civic-graph.network")
        .service("cgNetworkService", Service);

})(angular);
