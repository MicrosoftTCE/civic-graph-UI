(function (angular, d3) {

    "use strict";

    function Controller($scope, $timeout, _, networkService, entityService, connectionService, utils) {
        var entityTypes = entityService.getEntityTypes();
        var connectionTypes = connectionService.getConnectionTypes();
        var currentEntity = null;

        activate();

        function activate() {
            // TODO: Make a hashmap on the backend of id -> position, then use source:
            // entities[map[sourceid]] to get nodes. See http://stackoverflow.com/q/16824308
            $scope.isLoading = true;
            $scope.connections = {};

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

            $scope.$on("triggerNetworkDraw", buildAndDrawNetwork);

            $scope.$watch(networkService.minConnection, function (n) {
                console.log(n);
            });

            $scope.$watchGroup(
                [
                    networkService.minConnection,
                    networkService.sizeBy
                ],
                _.debounce(buildAndDrawNetwork)
            );

            connectionService
                .getAll()
                .then(function (data) {
                    console.log("API Call was a success!", data);

                    networkService.setConnectionObj(data.connections);

                    $scope.isLoading = false;

                    buildAndDrawNetwork();
                });
        }

        function buildAndDrawNetwork(n, o) {
            if (!(utils.isDefined(o) && utils.isDefined(n)) && o === n) {
                return;
            }

            var graphData = {
                "nodeList": networkService.getGraphNodeList(),
                "linkList": networkService.getGraphLinkList()
            };

            drawNetwork(graphData);
        }

        /**
         * @param { { nodeList, linkList } } graphData
         */
        function drawNetwork(graphData) {
            /**
             * @type {Object}
             * @property {Function} select
             * @property {Function} append
             */
            var root = d3.select("#network");

            var sizeBy = networkService.sizeBy();

            /** @type Array.<Object> */
            var entityArray = graphData.nodeList.map(function (d) {
                return d.value;
            });
            /** @type Array.<Object> */
            var connectionArray = graphData.linkList;

            // Delete the old graph
            if (utils.isDefined(root.select("svg"))) {
                root.select("svg").remove();
            }

            // Create an svg that will take up the entire height of the screen and the
            // entire width of the parent div
            var svg = root
                .append("svg")
                .attr("height", "100vh")
                .attr("width", "100%");

            /** @type {ClientRect} **/
            var bounds = svg.node().getBoundingClientRect();

            var sizeByScale = buildScaleFunction(entityArray, sizeBy);

            var height = bounds.height;
            var width = bounds.width;
            // var hoverTimer;
            var offsetScale = 6;
            var defaultNodeSize = 7;
            var offsets = {
                'Individual': { 'x': 1, 'y': 1 },
                'For-Profit': { 'x': 1, 'y': -1 },
                'Non-Profit': { 'x': -1, 'y': 1 },
                'Government': { 'x': -1, 'y': -1 }
            };
            var upperBoundRadius = 50;
            var linkedByIndex = {};

            var links = {};

            var force = buildForceLayout(
                { "nodeList": entityArray, "linkList": connectionArray },
                bounds
            );

            _.forEach(connectionArray, function (connections, type) {
                links[type] = svg.selectAll('.link .' + type + '-link')
                    .data(connections)
                    .enter().append('line')
                    .attr('class', function (d) {
                        if (!utils.isDefined(d.source) || !utils.isDefined(d.target)) {
                            return "";
                        }
                        d.type = type;
                        return 'link '
                            + type + '-link '
                            + d.source.type + '-link '
                            + d.target.type + '-link';
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
                    return utils.isDefined(d[sizeBy]) ? sizeByScale(d) : defaultNodeSize;
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

            if (!$scope.mobile) {
                speedAnimate(7);
            }

            // Hash linked neighbors for easy hovering effects.
            // See http://stackoverflow.com/a/8780277
            _.forEach(links, function (l) {
                _.forEach(l[0], function (connection) {
                    var source = connection.__data__.source;
                    var target = connection.__data__.target;
                    linkedByIndex[source.index + ',' + target.index] = true;
                    linkedByIndex[target.index + ',' + source.index] = true;
                });
            });

            // node.on('mouseover', hover);
            // node.on('mouseout', unHover);
            node.on('click', click);
            node.on('dblclick', dblClick);
            svg.on('click', backgroundClick);

            node.classed('wellconnected', function (d) {
                return d.hasOwnProperty('wellconnected');
            });

            $scope.$on('changeSizeBy', function (event, sizeBy) {
                svg.selectAll('circle')
                    .transition()
                    .duration(250)
                    .attr('r', function (d) {
                        return d[sizeBy] ? sizeByScale[sizeBy](d[sizeBy]) : defaultNodeSize;
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

            function buildScaleFunction(nodeList, param) {
                var lowerBoundRadius = 10;
                var upperBoundRadius = 50;
                var maxNodeParam = d3.max(nodeList, findMaxNodeByParam);

                function findMaxNodeByParam(d) {
                    var v = d[param];
                    return isFinite(v) && utils.isDefined(v) ? v : 0;
                }

                return function (obj) {
                    return d3.scale
                        .sqrt()
                        .domain([0, maxNodeParam])
                        .range([lowerBoundRadius, upperBoundRadius])(obj[param]);
                };
            }

            /**
             * Calculates the repulsion charge of the entities in the graph based on the number of
             * employees.
             *
             * @param {Object} d - An entity in our graph's data list
             * @returns {number} The charge based on the entity's number of employees
             */
            function calculateCharge(d) {
                return utils.isDefined(d[sizeBy])
                    ? -2 * sizeByScale(d)
                    : -20;
            }

            /**
             *
             * @param {Object} data
             * @param {ClientRect} bounds
             * @returns {*}
             */
            function buildForceLayout(data, bounds) {
                return d3.layout
                    .force()
                    .size([bounds.width, bounds.height])
                    .nodes(data.nodeList)
                    .links(_.flatten(_.values(data.linkList)))
                    .linkStrength(0)
                    .linkDistance(50)
                    .charge(calculateCharge)
                    .start();
            }

            function speedAnimate(ticks) {
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
            }

            function focus(entity) {
                if (utils.isDefined(currentEntity)) {
                    // If they are the same, then we don't need to do anything
                    if (_.isEqual(currentEntity, entity)) {
                        return;
                    }
                    // If not, then call unFocus to setup for new focused entity
                    else {
                        unFocus(currentEntity);
                    }
                }

                currentEntity = entity;

                $scope.$emit("setCurrentEntity", entity);

                focusNeighbors(entity);

                $scope.safeApply();

                function focusNeighbors(entity) {
                    function neighboring(a, b) {
                        return linkedByIndex[a.index + ',' + b.index] || a.index === b.index;
                    }

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
                                return entity.index === o.source.index || entity.index === o.target.index;
                            })
                            .classed('unfocused', function (o) {
                                return !(entity.index === o.source.index || entity.index === o.target.index);
                            });
                    });
                }
            }

            function unFocus(entity) {
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
                if (utils.isDefined(currentEntity)) {
                    force.resume();
                }
            }

            // function hover(entity) {
            //     if (!utils.isDefined(currentEntity)) {
            //         hoverTimer = $timeout(
            //             function () {
            //                 focus(entity);
            //             },
            //             500
            //         );
            //     }
            //
            //     $scope.safeApply();
            // }
            //
            // function unHover(entity) {
            //     if (_.isEqual(currentEntity, entity)) {
            //         unFocus(entity);
            //         $timeout.cancel(hoverTimer);
            //     }
            //     // $scope.actions.interacted = true;
            //     $scope.safeApply();
            // }

            function click(entity) {
                //  If the previous node is equal to the new node, do nothing.
                if (_.isEqual(currentEntity, entity)) {
                    console.debug("You clicked the same thing, exiting");
                    return;
                }

                $scope.showLicense = false;

                focus(entity);

                // Stop event so we don't detect a click on the background.
                // See http://stackoverflow.com/q/22941796
                if (d3.event) {
                    d3.event.stopPropagation();
                }

                // $scope.actions.interacted = true;

                $scope.safeApply();
            }

            function backgroundClick() {
                console.debug("You clicked the background, unfocusing entity");
                if (!utils.isDefined(currentEntity)) {
                    return;
                }

                unFocus(currentEntity);
                currentEntity = null;
                $scope.$emit("setCurrentEntity", null);
                $scope.safeApply();
            }

            function dblClick(entity) {
                if (!_.isEqual(currentEntity, entity)) {
                    return;
                }

                if (!entity.fixed) {
                    entity.x = width / 2;
                    entity.y = height / 2;
                    entity.px = width / 2;
                    entity.py = height / 2;
                    entity.fixed = true;
                    currentEntity = entity;
                }
                else {
                    unFocus(entity);
                    $scope.$emit("setCurrentEntity", null);
                }

                // $scope.actions.interacted = true;

                $scope.safeApply();
            }
        }
    }

    Controller.$inject = [
        "$scope",
        "$timeout",
        "_",
        "cgNetworkService",
        "entityService",
        "connectionService",
        "cgUtilService"
    ];

    function Directive() {
        return {
            "restrict": "E",
            "templateUrl": "js/network/network.template.html",
            "controller": Controller,
            "controllerAs": "network",
            "scope": {},
            "bindToController": {}
        };
    }

    angular
        .module("civic-graph.network")
        .directive("network", Directive);

})(angular, d3);
