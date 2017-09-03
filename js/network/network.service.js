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
     * @constructor
     */
    function Service(_, utils, entityService) {
        var self = this;
        var entityList = [];
        var connectionObj = {};

        var _minConnection = 2;
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
                _minConnection = 0;
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
                var obj = {};

                var connections = connectionObj[key];
                obj[key] = connections
                    .map(function (connection) {
                        var sourceNode = nodeList.find(findById(connection.source));
                        var targetNode = nodeList.find(findById(connection.target));
                        if (!( utils.isDefined(sourceNode) && utils.isDefined(targetNode) )) {
                            return null;
                        }
                        return { "source": sourceNode, "target": targetNode };
                    })
                    .filter(utils.isDefined);

                return obj;
            }

            return Object
                .keys(connectionObj)
                .map(buildConnectionObject)
                .reduce(function (obj, c) {
                    return Object.assign({}, obj, c);
                }, {});
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
        "entityService"
    ];

    angular
        .module("civic-graph.network")
        .service("cgNetworkService", Service);

})(angular);
