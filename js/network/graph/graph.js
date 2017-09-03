(function (angular, d3) {

    "use strict";

    var isDefined;

    function buildSvgElement(root) {
        // Delete the old graph
        if (isDefined(root.select("svg"))) {
            root.select("svg").remove();
        }

        return root
            .append("svg")
            .attr("height", "100vh")
            .attr("width", "100%");
    }

    // This is strange one that I have cleaned up a bit from the old graph.  In the
    // old graph, there was an object called scale that had a d3 sqrt function built
    // for employees and followers.  Instead of using theirs, I built this function
    // that builds the scale function based on the data and parameter to scale by.
    function buildScaleFunction(sizeBy) {
        return function (nodeList) {
            var lowerBoundRadius = 10;
            var upperBoundRadius = 50;
            var maxNodeParam = d3.max(nodeList, getGraphObjParam);

            function getGraphObjParam(d) {
                var v = d.value[sizeBy];
                return isFinite(v) && isDefined(v) ? v : 0;
            }

            return function (obj) {
                return d3.scale
                    .sqrt()
                    .domain([0, maxNodeParam])
                    .range([lowerBoundRadius, upperBoundRadius])(obj.value[sizeBy]);
            };
        };
    }

    // Used to describe the four corners of the graph.  By default, force layout
    // keeps the nodes focused on the center of the graph, but in our case, we want
    // the nodes separated to each corner.
    function buildFoci(bounds) {
        function twentyFivePercent(v) {
            return v / 4;
        }

        function seventyFivePercent(v) {
            return v - twentyFivePercent(v);
        }

        return {
            'Individual': {
                'x': twentyFivePercent(bounds.width),
                'y': twentyFivePercent(bounds.height)
            },
            'For-Profit': {
                'x': twentyFivePercent(bounds.width),
                'y': seventyFivePercent(bounds.height)
            },
            'Non-Profit': {
                'x': seventyFivePercent(bounds.width),
                'y': twentyFivePercent(bounds.height)
            },
            'Government': {
                'x': seventyFivePercent(bounds.width),
                'y': seventyFivePercent(bounds.height)
            }
        };
    }

    function buildChargeFunction(sizeBy) {
        return function (nodeList) {
            var sizeByScale = buildScaleFunction(sizeBy)(nodeList);

            return function (d) {
                return isDefined(d.value[sizeBy])
                    ? -2 * sizeByScale(d)
                    : -20;
            };
        };
    }

    function Directive($window, _, utils, cgService, networkService) {
        isDefined = utils.isDefined;

        function LinkFn(scope, element) {
            var root = d3.select(element[0]);
            var _buildScaleFunction;
            var _buildChargeFunction;

            $window.onresize = _.debounce(onWindowResize);

            scope.$watch(networkService.sizeBy, watchSizeBy);

            scope.$watchGroup([networkService.minConnection, networkService.sizeBy], run);

            scope.$watchCollection(_.debounce(getWindowBox), run);

            scope.$watchCollection(networkService.getGraphLinkList, run);

            function getWindowBox() {
                // Returns the inner width of the browser window, for refreshing d3 graph
                function getWindowWidth() {
                    return angular.element($window)[0].innerWidth;
                }

                function getWindowHeight() {
                    return angular.element($window)[0].innerHeight;
                }

                return [getWindowHeight(), getWindowWidth()];
            }

            // Whenever the window is resized, then we need to re-run angular's compile chain.
            function onWindowResize() {
                scope.$apply();
            }

            function run(n, o) {
                if (n === o) {
                    return;
                }

                var nodeList = networkService.getGraphNodeList();
                var linkList = networkService.getGraphLinkList();

                render({ nodeList: nodeList, linkList: linkList });
            }

            /**
             * @param { { nodeList, linkList } } graphData
             */
            function render(graphData) {
                var svg = buildSvgElement(root);
                svg.on("click", function () {
                    scope.$apply(backgroundClick);
                });

                if (graphData.nodeList.length === 0) {
                    console.log("Node list is empty, not drawing a graph");
                    return;
                }

                var bounds = svg.node().getBoundingClientRect();

                var sizeByScale = _buildScaleFunction(graphData.nodeList);
                var calculateCharge = _buildChargeFunction(graphData.nodeList);

                var foci = buildFoci(bounds);

                var forceLayout = buildForceLayout(graphData, bounds);

                var node = drawNode(graphData.nodeList);

                // TODO: Build Connection List
                var connection = drawConnection(graphData.linkList);

                forceLayout.on("tick", function (event) {
                    function tick() {
                        var k = 0.1 * event.alpha;

                        connection
                            .attr("x1", function (d) {
                                return d.source.x;
                            })
                            .attr("y1", function (d) {
                                return d.source.y;
                            })
                            .attr("x2", function (d) {
                                return d.target.x;
                            })
                            .attr("y2", function (d) {
                                return d.target.y;
                            });

                        graphData.nodeList.forEach(function (d) {
                            d.y += (foci[d.value.type].y - d.y) * k;
                            d.x += (foci[d.value.type].x - d.x) * k;
                        });

                        node.attr("transform", function (d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    }

                    scope.$apply(tick);
                });

                function buildForceLayout(data, bounds) {
                    return d3.layout
                        .force()
                        .size([bounds.width, bounds.height])
                        .nodes(data.nodeList)
                        .links(data.linkList)
                        .linkStrength(0)
                        .linkDistance(50)
                        .gravity(0.01)
                        .charge(calculateCharge)
                        .start();
                }

                function drawNode(nodeList) {
                    var defaultSize = 10;

                    function getCircleRadius(n) {
                        return isDefined(n) ? sizeByScale(n) : defaultSize;
                    }

                    function clickEvent(obj) {
                        function click() {
                            if (utils.isDefined(d3.event)) {
                                d3.event.preventDefault();
                                d3.event.stopPropagation();
                            }
                            obj.selected = true;
                            focus(obj);
                        }

                        scope.$apply(click);
                    }

                    var node = svg
                        .selectAll(".node")
                        .data(nodeList)
                        .enter().append("g")
                        .attr("class", function (d) {
                            return 'node ' + d.value.type + '-node';
                        })
                        .on("click", clickEvent)
                        .call(forceLayout.drag);

                    // Appends circles to each node
                    node.append("circle")
                        .attr("r", getCircleRadius);

                    node.append('text')
                        .text(function (d) {
                            return isDefined(d.value.nickname) ? d.value.nickname : d.value.name;
                        })
                        .attr('dx', function () {
                            return (-0.065 * this.getComputedTextLength() / 2) + 'em';
                        })
                        .attr('dy', function () {
                            return (0.08 * this.parentNode.getBBox().height / 2 + 0.5) + 'em';
                        });

                    return node;
                }

                function focus(entity) {
                    if (utils.isDefined(cgService.currentEntity())) {
                        // If they are the same, then we don't need to do anything
                        if (_.isEqual(cgService.currentEntity(), entity.value)) {
                            return;
                        }
                        // If not, then call unFocus to setup for new focused entity
                        else {
                            unFocus(entity);
                        }
                    }

                    cgService.currentEntity(entity.value);
                    // scope.$emit("setCurrentEntity", entity);

                    focusNeighbors(entity);
                    function focusNeighbors(entity) {
                        console.log(entity);
                        function compareAgainstConnectionObj(d) {
                            return function (c) {
                                return d.source === c.index || d.target === c.index;
                            };
                        }

                        function neighboring(a) {
                            return function (b) {
                                return a.index === b.index
                                    || utils.isDefined(graphData.linkList.find(compareAgainstConnectionObj(a)));
                            };
                        }

                        // Apply 'unfocused' class to all non-neighbors.
                        // Apply 'focused' class to all neighbors.
                        // TODO: See if it can be done with just one class and :not(.focused) CSS selectors.
                        node
                            .classed('focused', neighboring(entity))
                            .classed('unfocused', _.negate(neighboring(entity)));

                        connection
                            .classed('focused', compareAgainstConnectionObj(entity))
                            .classed('unfocused', _.negate(compareAgainstConnectionObj));
                    }
                }

                function backgroundClick() {
                    if (!utils.isDefined(cgService.currentEntity())) {
                        return;
                    }

                    unFocus();
                    cgService.currentEntity(null);
                }

                function unFocus(entity) {
                    node
                        .classed('focused', false)
                        .classed('unfocused', false);

                    connection
                        .classed('focused', false)
                        .classed('unfocused', false);

                    if (utils.isDefined(entity)) {
                        entity.fixed = false;
                    }
                    else {
                        graphData.nodeList.forEach(function (d) {
                            d.fixed = false;
                        });
                    }

                    // Restart d3 animations.
                    if (utils.isDefined(cgService.currentEntity)) {
                        forceLayout.resume();
                    }
                }

                function drawConnection(connectionList) {
                    return svg
                        .selectAll(".link")
                        .data(connectionList)
                        .enter().append("line")
                        .attr("class", function (l) {
                            return 'link ' + l.type + '-link ';
                        });
                }
            }

            function watchSizeBy(newSizeBy) {
                if (!isDefined(newSizeBy)) {
                    return;
                }
                _buildScaleFunction = buildScaleFunction(newSizeBy);
                _buildChargeFunction = buildChargeFunction(newSizeBy);
            }
        }

        return {
            "restrict": "E",
            "link": LinkFn
        };
    }

    Directive.$inject = [
        "$window",
        "_",
        "cgUtilService",
        "cgMainService",
        "cgNetworkService"
    ];

    angular
        .module("civic-graph.network")
        .directive("cgNetworkGraph", Directive);

})(angular, d3);
