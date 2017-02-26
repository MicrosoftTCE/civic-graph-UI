(function (angular, RTP) {

    'use strict';

    var dependencies = [
        '$scope',
        '_',
        'connectionService',
        Controller
    ];

    function isDef(o) {
        return o !== undefined && o !== null;
    }

    function isObj(o) {
        return isDef(o) && (typeof o === "object");
    }

    function Controller($scope, _, connectionService) {
        activate();

        function activate() {
            $scope.isLoading = true;
            $scope.connections = {};

            // See https://coderwall.com/p/ngisma/safe-apply-in-angular-js
            $scope.safeApply = safeApply;

            $scope.$on('entitiesLoaded', entitiesLoaded);
        }

        function entitiesLoaded() {
            connectionService.getFromAPI().then(parseConnections);
        }

        function parseConnections(data) {
            if (!isObj(data.connections) || !Array.isArray($scope.entities)) {
                return;
            }

            function createFilteredConnections(e, t) {
                e[t] = [];
                return e;
            }

            function filterMinConnections(entity) {
                return entity.collaborations.length >= $scope.minConnections;
            }

            var connectionKeys = Object.keys(data.connections);

            var filteredEntities = $scope.entities.filter(filterMinConnections);
            var filteredConnections = connectionKeys.reduceRight(createFilteredConnections, {});

            // TODO: Convert this into a flatMap that creates filtered connections
            function firstLayer(connectionTypeObject) {
                var connections = connectionTypeObject.connections;
                var type = connectionTypeObject.type;

                function findSourceTargetEntities(connection) {
                    return {
                        "source": _.find(filteredEntities, {'id': connection.source}),
                        "target": _.find(filteredEntities, {'id': connection.target})
                    };
                }

                function filterNonExistentEntities(sourceTarget) {
                    return isDef(sourceTarget.source) && isDef(sourceTarget.target);
                }

                connections
                    .map(findSourceTargetEntities)
                    .filter(filterNonExistentEntities)
                    .reduceRight(function (obj, sourceTarget) {
                        obj[type].push(sourceTarget);
                        return obj;
                    }, filteredConnections);
            }

            function mapKeyToValue(k) {
                return {"type": k, "connections": data.connections[k]};
            }

            var typeConnectionObj = connectionKeys.map(mapKeyToValue);


            typeConnectionObj.forEach(firstLayer);


            // Only show labels on top 5 most connected entities initially.
            _.forEach(_.keys($scope.entityTypes), function (type) {
                // Find the top 5 most-connected entities.
                var top5 = _.takeRight(_.sortBy(_.filter($scope.entities, {'type': type}),
                    'collaborations.length'), 5);
                _.forEach(top5, function (entity) {
                    entity.wellconnected = true;
                });
            });

            filteredEntities = _.sortBy(filteredEntities, function (e) {
                return (e.wellconnected) ? 1 : 0;
            });

            // var drawFunc = ($scope.mobile ? drawNetworkMobile : drawNetwork);
            // $scope.isLoading = drawFunc(filteredEntities, filteredConnections);
            $scope.entitiesAndConnections = {"entityArray": filteredEntities, "connectionArray": filteredConnections};
            console.log("Should be refreshing directive now");
            $scope.isLoading = false;
        }

        function safeApply(fn) {
            var phase = this.$root.$$phase;
            if (phase === '$apply' || phase === '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        }
    }

    angular.module('mscg.network.graph')
        .controller('networkCtrl', dependencies);

})(angular, RTP);
