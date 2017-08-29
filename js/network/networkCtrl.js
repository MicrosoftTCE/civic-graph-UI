(function (angular) {

    "use strict";

    function Controller($scope, $filter, _, entityService, connectionService, utils) {
        // TODO: Make a hashmap on the backend of id -> position, then use source:
        // entities[map[sourceid]] to get nodes. See http://stackoverflow.com/q/16824308
        $scope.isLoading = true;
        $scope.connections = {};
        var entityTypes = entityService.getEntityTypes;
        var connectionTypes = connectionService.getConnectionTypes();
        startLoad();

        // See https://coderwall.com/p/ngisma/safe-apply-in-angular-js
        $scope.safeApply = function (fn) {
            var phase = this.$root.$$phase;
            if (phase === '$apply' || phase === '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

        $scope.$on('triggerNetworkDraw', startLoad);

        $scope.$on('viewChange', function (viewObj) {
            console.log(viewObj);
        });

        var drawNetwork = function (entityArray, connectionArray) {
            $scope.isLoading = false;

            var svg = d3.select('#network');
            svg.selectAll("*").remove();
            var bounds = svg.node().getBoundingClientRect();
            var height = bounds.height;
            var width = bounds.width;
            var offsetScale = 6;
            var defaultNodeSize = 7;
            var offsets = {
                'Individual': { 'x': 1, 'y': 1 },
                'For-Profit': { 'x': 1, 'y': -1 },
                'Non-Profit': { 'x': -1, 'y': 1 },
                'Government': { 'x': -1, 'y': -1 }
            };
            var lowerBoundRadius = 10;
            var upperBoundRadius = 50;
            var maxEmployees = d3.max(entityArray, function (el) {
                return parseInt(el.employees);
            });
            var maxFollowers = d3.max(entityArray, function (el) {
                return parseInt(el.followers);
            });
            var scale = {
                'employees': d3.scale.sqrt().domain([10, maxEmployees])
                    .range([lowerBoundRadius, upperBoundRadius]),
                'followers': d3.scale.sqrt().domain([10, maxFollowers])
                    .range([lowerBoundRadius, upperBoundRadius])
            };
            var links = {};
            var force = d3.layout.force()
                .size([width, height])
                .nodes(entityArray)
                .links(_.flatten(_.values(connectionArray)))
                .charge(function (d) {
                    return d.employees ? -2 * scale.employees(d.employees) : -20;
                })
                .linkStrength(0)
                .linkDistance(50);

            _.forEach(connectionArray, function (connections, type) {
                links[type] = svg.selectAll('.link .' + type + '-link')
                    .data(connections)
                    .enter().append('line')
                    .attr('class', function (d) {
                        if (!utils.isDefined(d.source) || !utils.isDefined(d.target)) {
                            return "";
                        }
                        d.type = type;
                        return 'link ' + type + '-link ' + d.source.type + '-link ' + d.target.type
                            + '-link';
                    });
            });

            var node = svg.selectAll('.node')
                .data(entityArray)
                .enter().append('g')
                .attr('class', function (d) {
                    return 'node ' + d.type + '-node';
                })
                .call(force.drag);

            node.append('circle')
                .attr('r', function (d) {
                    return d.employees ? scale['employees'](d.employees) : defaultNodeSize;
                });

            node.append('text')
                .text(function (d) {
                    return d.nickname ? d.nickname : d.name;
                })
                .attr('dx', function () {
                    return (-0.065 * this.getComputedTextLength() / 2) + 'em';
                })
                .attr('dy', function () {
                    return (0.08 * this.parentNode.getBBox().height / 2 + 0.5) + 'em';
                });

            force.on('tick', function (e) {
                // Cluster in four corners based on offset.
                var k = offsetScale * e.alpha;
                // console.log(e.alpha)
                _.forEach(entityArray, function (entity) {
                    if (entity.x && offsets[entity.type]) {
                        entity.x += offsets[entity.type].x * k;
                        entity.y += offsets[entity.type].y * k;
                        entity.x =
                            Math.max(upperBoundRadius,
                                Math.min(width - upperBoundRadius, entity.x));
                        entity.y =
                            Math.max(upperBoundRadius,
                                Math.min(height - upperBoundRadius, entity.y));
                    }
                });

                _.forEach(links, function (link) {
                    link
                        .attr('x1', function (d) {
                            return d.source.x;
                        })
                        .attr('y1', function (d) {
                            return d.source.y;
                        })
                        .attr('x2', function (d) {
                            return d.target.x;
                        })
                        .attr('y2', function (d) {
                            return d.target.y;
                        });
                });
                node.attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });
            });
            var speedAnimate = function (ticks) {
                // Speed up the initial animation.
                // See http://stackoverflow.com/a/26189110
                requestAnimationFrame(function render() {
                    for (var i = 0; i < ticks; i++) {
                        force.tick();
                    }
                    if (force.alpha() > 0) {
                        requestAnimationFrame(render);
                    }
                });
            };
            if (!$scope.mobile) {
                speedAnimate(7);
            }
            force.start();

            // Hash linked neighbors for easy hovering effects.
            // See http://stackoverflow.com/a/8780277
            var linkedByIndex = {};
            _.forEach(links, function (l) {
                _.forEach(l[0], function (connection) {
                    var source = connection.__data__.source;
                    var target = connection.__data__.target;
                    linkedByIndex[source.index + ',' + target.index] = true;
                    linkedByIndex[target.index + ',' + source.index] = true;
                });
            });

            var neighboring = function (a, b) {
                return linkedByIndex[a.index + ',' + b.index] || a.index === b.index;
            };

            var focusneighbors = function (entity) {
                // Apply 'unfocused' class to all non-neighbors.
                // Apply 'focused' class to all neighbors.
                // TODO: See if it can be done with just one class and :not(.focused) CSS selectors.
                node
                    .classed('focused', function (n) {
                        return neighboring(entity, n);
                    })
                    .classed('unfocused', function (n) {
                        return !neighboring(entity, n);
                    });

                _.forEach(links, function (link) {
                    link
                        .classed('focused', function (o) {
                            return entity.index === o.source.index || entity.index
                                === o.target.index;
                        })
                        .classed('unfocused', function (o) {
                            return !(entity.index === o.source.index || entity.index
                            === o.target.index);
                        });
                });
            };

            var focus = function (entity) {
                if ($scope.currentEntity !== entity) {
                    $scope.setEntity(entity);
                }
                $scope.safeApply();
                focusneighbors(entity);
            };

            var unfocus = function (entity) {
                //var transitiondelay = 75;
                node
                    .classed('focused', false)
                    .classed('unfocused', false);
                _.forEach(links, function (link) {
                    link
                        .classed('focused', false)
                        .classed('unfocused', false);
                });
                entity.fixed = false;
                // Restart d3 animations.
                if ($scope.clickedEntity.entity) {
                    force.resume();
                }
                //TODO: Show generic details and not individual entity details?
            };
            var hoverTimer;
            var hover = function (entity) {
                if (!$scope.clickedEntity.entity && !$scope.editing && !$scope.currentLocation) {
                    hoverTimer = setTimeout(function () {
                        focus(entity);
                    }, 500);
                }
                $scope.actions.interacted = true;
                $scope.safeApply();
            };
            var unhover = function (entity) {
                if (!$scope.clickedEntity.entity && !$scope.currentLocation) {
                    unfocus(entity);
                    clearTimeout(hoverTimer);
                }
                $scope.actions.interacted = true;
                $scope.safeApply();
            };

            var click = function (entity) {
                $scope.showLicense = false;

                //  If the previous node is equal to the new node, do nothing.
                if ($scope.clickedEntity.entity === entity) {
                    $scope.clickedEntity.entity = null;
                }
                else {
                    //  Unfocus on previous node and focus on new node.
                    if ($scope.clickedEntity.entity) {
                        unfocus($scope.clickedEntity.entity);
                    }
                    $scope.clickedEntity.entity = entity;
                    focus(entity);
                }

                // Stop event so we don't detect a click on the background.
                // See http://stackoverflow.com/q/22941796
                if (d3.event) {
                    d3.event.stopPropagation();
                }
                $scope.actions.interacted = true;
                $scope.safeApply();
            };

            var backgroundclick = function () {
                if (utils.isDefined($scope.clickedEntity.entity)) {
                    unfocus($scope.clickedEntity.entity);
                    $scope.clickedEntity.entity = null;
                }
                $scope.safeApply();
                //TODO: Show generic details and not individual entity details.
            };
            var dblclick = function (entity) {
                if (!entity.fixed) {
                    entity.x = width / 2;
                    entity.y = height / 2;
                    entity.px = width / 2;
                    entity.py = height / 2;
                    entity.fixed = true;
                    $scope.clickedEntity.entity = entity;
                } else {
                    unfocus(entity);
                }
                $scope.actions.interacted = true;
                $scope.safeApply();
            };

            node.on('mouseover', hover);
            node.on('mouseout', unhover);
            node.on('click', click);
            node.on('dblclick', dblclick);
            svg.on('click', backgroundclick);

            node
                .classed('wellconnected', function (d) {
                    return d.hasOwnProperty('wellconnected');
                });

            $scope.$on('changeSizeBy', function (event, sizeBy) {
                svg.selectAll('circle')
                    .transition()
                    .duration(250)
                    .attr('r', function (d) {
                        return d[sizeBy] ? scale[sizeBy](d[sizeBy]) : defaultNodeSize;
                    });
            });
            $scope.$on('toggleLink', function (event, link) {
                // links[link.name]
                // .classed({'visible': link.enabled, 'hidden': !link.enabled});
                _.map(entityTypes, function (val, key) {
                    svg
                        .selectAll('.' + key + '-link')
                        .classed({
                            'visible': function (l) {
                                // ConnectionType enabled, connection source entity type
                                // is enabled, connection target entity type is enabled.
                                return !connectionTypes[l.type]
                                    || (
                                        entityTypes[l.source.type] && entityTypes[l.target.type]
                                    );
                            },
                            'hidden': function (l) {
                                // If any of ConnectionType, source entity type, or target
                                // entity type are disabled.
                                return !connectionTypes[l.type]
                                    || (
                                        !entityTypes[l.source.type] || !entityTypes[l.target.type]
                                    );
                            }
                        });

                });
            });
            $scope.$on('toggleNode', function (event, type) {
                svg
                    .selectAll('.' + type.name + '-node')
                    .classed({ 'visible': type.enabled, 'hidden': !type.enabled });

                svg
                    .selectAll('.' + type.name + '-link')
                    .classed({
                        'visible': function (l) {
                            // ConnectionType enabled, connection source entity type is
                            // enabled, connection target entity type is enabled.
                            return connectionTypes[l.type]
                                && (
                                    entityTypes[l.source.type] && entityTypes[l.target.type]
                                );
                        },
                        'hidden': function (l) {
                            // If any of ConnectionType, source entity type, or target
                            // entity type are disabled.
                            return !connectionTypes[l.type]
                                || (
                                    !entityTypes[l.source.type] || !entityTypes[l.target.type]
                                );
                        }
                    });

            });

            $scope.$on('selectItem', function () {
                click($scope.currentEntity);
            });
        };

        function startLoad() {
            function success(data) {
                var filteredEntities = $filter('filter')($scope.entities,
                    function (entity) {
                        return entity.collaborations.length
                            >= $scope.minConnections;
                    }
                );
                var filteredConnections = {};
                _.forEach(_.keys(data.connections), function (type) {
                    // $scope.connections[type] = [];
                    filteredConnections[type] = [];
                });
                _.forEach(data.connections, function (connections, type) {
                    _.forEach(connections, function (connection) {
                        var sourceNode = _.find(filteredEntities, { 'id': connection.source });
                        var targetNode = _.find(filteredEntities, { 'id': connection.target });
                        if (!( utils.isDefined(sourceNode) && utils.isDefined(targetNode) )) {
                            return;
                        }

                        filteredConnections[type].push(
                            { 'source': sourceNode, 'target': targetNode });
                        // $scope.connections[type].push({'source': sourceNode, 'target':
                        // targetNode});
                    });
                });
                // Only show labels on top 5 most connected entities initially.
                _.forEach(_.keys(entityTypes), function (type) {
                    // Find the top 5 most-connected entities.
                    var top5 = _.takeRight(_.sortBy(_.filter($scope.entities, { 'type': type }),
                        'collaborations.length'), 5);
                    _.forEach(top5, function (entity) {
                        entity.wellconnected = true;
                    });
                });

                filteredEntities = _.sortBy(filteredEntities, function (e) {
                    return (e.wellconnected) ? 1 : 0;
                });

                drawNetwork(filteredEntities, filteredConnections);
            }

            connectionService
                .getAll()
                .then(success);
        }
    }

    Controller.$inject = ["$scope", "$filter", "_", "entityService", "connectionService", "cgUtilService"];

    angular.module('civic-graph')
        .controller('networkCtrl', Controller);

})(angular, RTP);
