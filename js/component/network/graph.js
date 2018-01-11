(function (angular, d3) {

    'use strict';

    var isDefined;

    /**
     * (Re)Builds the `svg` element on the screen.  This is a double-edged sword.  On one hand, much easier to
     * update the graph on data change, as it just deletes the old and lets us re-draw everything.  On the other hand,
     * we have to redraw everything, which can be a very slow process if there are too many nodes on the screen.
     *
     * The size is set to full view height and full container width.  This should make CSS easier, as it will respect
     * the width of the directive, meaning we don't have to worry about doing weird CSS in here.
     *
     * @param root - The root element, which should be provided by angular in the link function
     * @returns {*} - a new svg element
     */
    function buildSvgElement (root) {
        // Delete the old graph
        if ( isDefined(root.select('svg')) ) {
            root.select('svg').remove();
        }

        return root
            .append('svg')
            .attr('height', '100vh')
            .attr('width', '100%');
    }

    /**
     * This is strange one that I have cleaned up a bit from the old graph.  In the  old graph, there was an object
     * called scale that had a d3 sqrt function built for employees and followers.  Instead of using theirs,
     * I built this function that builds the scale function based on the data and parameter to scale by.
     *
     * This is so that every time the node list changes, the scale functions are easy to regenerate
     *
     * @param sizeBy - The attribute to scale the nodes by.  This will probably come from network service
     * @returns {Function} - This actually builds the function that builds the scale function.  So just give the
     * result of this function the node list and it will give you the scale
     */
    function buildScaleFunction (sizeBy) {
        return function (nodeList) {
            var lowerBoundRadius = 10;
            var upperBoundRadius = 50;
            var maxNodeParam = d3.max(nodeList, getGraphObjParam);

            function getGraphObjParam (d) {
                var v = d.value[ sizeBy ];
                return isFinite(v) && isDefined(v) ? v : 0;
            }

            return function (obj) {
                return d3.scale
                         .sqrt()
                         .domain([ 5, maxNodeParam ])
                         .range([ lowerBoundRadius, upperBoundRadius ])(obj.value[ sizeBy ]);
            };
        };
    }

    /**
     * Used to describe the four corners of the graph.  By default, force layout keeps the nodes focused on the
     * center of the graph, but in our case, we want the nodes separated to each corner.
     *
     * Technically, if you wanted to get fancy, you could make them cluster anywhere within the bounds, but the
     * original code did corners, so I did corners.
     *
     * @param bounds - Probably the size of the svg/root element, but could be any arbitrary width/height object
     * @returns {*} - The return value looks like this:
     * {{Individual: {x: *, y: *}, 'For-Profit': {x: *, y: *}, 'Non-Profit': {x: *, y: *}, Government: {x: *, y: *}}}
     */
    function buildFoci (bounds) {
        function percentageOfBoundary (v) {
            return v / 3;
        }

        function restOfBoundary (v) {
            return v - percentageOfBoundary(v);
        }

        return {
            'Individual': {
                'x': percentageOfBoundary(bounds.width),
                'y': percentageOfBoundary(bounds.height)
            },
            'For-Profit': {
                'x': percentageOfBoundary(bounds.width),
                'y': restOfBoundary(bounds.height)
            },
            'Non-Profit': {
                'x': restOfBoundary(bounds.width),
                'y': percentageOfBoundary(bounds.height)
            },
            'Government': {
                'x': restOfBoundary(bounds.width),
                'y': restOfBoundary(bounds.height)
            }
        };
    }

    /**
     * Another function that returns a function that takes the node list.
     *
     * This one builds the charge function for the force layout.  That is the property that prevents nodes from
     * overlapping.  The closer to 0, the more the overlap.  Settings currently reflect what the original code had.
     *
     * @param sizeBy - Since we need the size of the node, we need to know what to size by.
     * @returns {Function}
     */
    function buildChargeFunction (sizeBy) {
        return function (nodeList) {
            var sizeByScale = buildScaleFunction(sizeBy)(nodeList);

            return function (d) {
                return isDefined(d.value[ sizeBy ])
                    ? -2 * sizeByScale(d)
                    : -20;
            };
        };
    }

    /**
     * This is cleaner in ES6 or if I had created actual getter/setters instead of merging
     * them into a single method.  Basically, I need to call a function without accidentally
     * passing any values to it.
     *
     * For instance, `scope.watch` can take a function as the first argument, but passes values to it.
     * If I didn't want that to happen, I could just wrap the argument in this and it would be safe.
     */
    function wrapFn (fn) { return function () { return fn(); }; }

    function Directive ($window, _, utils, cgService, networkService) {
        // Who really wants to type `utils.` every time?
        isDefined = utils.isDefined;

        /**
         * This function is the secret to making Angular and D3 play nice.  From past experience, writing D3 directly
         * in an Angular controller or service just doesn't work out well.  The issue is Angular doesn't like anyone
         * but itself touching the HTML once it has been rendered.  This function will allow us to do what we need
         * before the Angular rendering happens, so we can create all of the stuff that D3 wants AND get the benefit
         * of Angular cleaning up for us once the directive has been removed from the screen.  Win-Win.
         *
         * @param scope - This is the same as a scope value that is passed to a controller
         * @param element - This is an array of elements, but the first value is actually just our root element
         */
        function LinkFn (scope, element) {
            // Get the root element
            var root = d3.select(element[ 0 ]);

            // These will store our builder functions that are returned from the above functions.
            var _buildScaleFunction;
            var _buildChargeFunction;

            // This is the listener that gets register in the render method.  We need to call it in order to remove
            // the listener whenever we plan on redrawing the graph. Hence, it is declared at this scope instead
            // of inside the render function
            var currentEntityListener;

            // Whenever a resize event happens, redraw the graph, but don't constantly do it.
            $window.onresize = _.debounce(onWindowResize);

            // Watch for changes to the sizeBy setting.  Probably will change this to a listener later so that it
            // doesn't constantly check for the value.  Low priority as the function is cheap
            scope.$watch(wrapFn(networkService.sizeBy), watchSizeBy);

            // Same as above, only this one will actually redraw the graph.  Still, the actual watcher's check is cheap,
            // so converting to event listener is still not a high priority
            scope.$watchGroup([ wrapFn(networkService.minConnection), wrapFn(networkService.sizeBy) ], run);

            // Similar to the onresize listener above.  Not entirely sure the difference, one of the two is probably
            // not needed.
            scope.$watchCollection(_.debounce(getWindowBox), run);

            // This is kind of an expensive operation.  High priority to convert to a listener.  It is waiting for
            // new data from the API, so that is an event the entire app needs to reload on.
            scope.$watch(networkService.getGraphData, run, true);

            /**
             * This function doesn't immediately make sense.  It returns an array because it is used for
             * `scope.$watchCollection`.  Like I said above, I don't think this is working properly, as I am not sure
             * that the `watchCollection` method calling it will give us the proper data, but haven't checked it.
             *
             * @returns {*[]}
             */
            function getWindowBox () {
                // Returns the inner width of the browser window, for refreshing d3 graph
                function getWindowWidth () {
                    return angular.element($window)[ 0 ].innerWidth;
                }

                function getWindowHeight () {
                    return angular.element($window)[ 0 ].innerHeight;
                }

                return [ getWindowHeight(), getWindowWidth() ];
            }

            /**
             * Whenever the window is resized, then we need to re-run angular's compile chain.
             *
             * This is just the event handler for the `$window.onresize`.  If we had ES6, would have just in-lined it.
             */
            function onWindowResize () {
                scope.$apply();
            }

            /**
             * Generic checker method to see if two things are equal and if not, redraw the graph.  There are so many
             * things that need this check that it was easier to just write this wrapper method.
             *
             * The equals check should probably be replaced with lodash's isEqual method
             */
            function run (n, o) {
                if ( n === o ) {
                    return;
                }

                if ( currentEntityListener ) {
                    currentEntityListener();
                }

                render(networkService.getGraphData());
            }

            /**
             * This is what populates the builder functions from above.  We don't need to call `render` because
             * there is another watcher that also sees changes to `sizeBy` that will take care of it for us.
             *
             * @param newSizeBy - the new sizeBy value seen by a watcher
             */
            function watchSizeBy (newSizeBy) {
                if ( !isDefined(newSizeBy) ) {
                    return;
                }
                _buildScaleFunction = buildScaleFunction(newSizeBy);
                _buildChargeFunction = buildChargeFunction(newSizeBy);
            }

            /**
             * This is the main function of this file.  Takes in the data required and draws the graph.
             *
             * @param { { nodeList, linkList } } graphData
             */
            function render (graphData) {
                // Get our svg element for this draw
                var svg = buildSvgElement(root);
                // Attach a listener that will fire when clicking anything other than a node
                svg.on('click', function () { scope.$apply(backgroundClick); });

                // Safety check to just skip everything if we haven't been given any nodes
                if ( graphData.nodeList.length === 0 ) {
                    console.debug('Node list is empty, not drawing a graph');
                    return;
                }

                // Get the size of the drawing area that we are allowed to work with
                var bounds = svg.node().getBoundingClientRect();

                // Build our scale functions based on the nodes provided
                var sizeByScale = _buildScaleFunction(graphData.nodeList);
                var calculateCharge = _buildChargeFunction(graphData.nodeList);

                // Build our focus points based on the size of the drawing area
                var foci = buildFoci(bounds);

                // Build the actual D3 graph
                var forceLayout = buildForceLayout(graphData, bounds);

                // The order of calling drawConnection and drawNode KIND OF matter
                // They can be change, that doesn't matter
                // But if drawNode happens first, then the lines get drawn on top of the circles, which looks weird

                var connection = drawConnection(graphData.linkList);

                var node = drawNode(graphData.nodeList);

                // `tick` is an event that happens, well, every "tick".  What this allows us to do is adjust the rate
                // at which the nodes will make their way to the focus points.  Also, we have to tell Angular that
                // stuff is happening because, like I said before, Angular does not like stuff messing around in the
                // HTML without its permission
                forceLayout.on('tick', function (event) {
                    function tick () {
                        var k = 0.1 * event.alpha;

                        connection
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

                        graphData.nodeList.forEach(function (d) {
                            d.y += (foci[ d.value.type ].y - d.y) * k;
                            d.x += (foci[ d.value.type ].x - d.x) * k;
                        });

                        node.attr('transform', function (d) {
                            return 'translate(' + d.x + ',' + d.y + ')';
                        });
                    }

                    scope.$apply(tick);
                });

                // Listen for a new current entity and save the listener to be destroyed on next redraw
                currentEntityListener = scope.$on(
                    'cg.current-entity.update',
                    function (event, args) { focusCurrentEntity(args); }
                );

                /**
                 * Focus the current entity, if it exists
                 *
                 * @param currentEntity - The current entity selected in the app.  Could technically
                 * be any arbitrary entity
                 */
                function focusCurrentEntity (currentEntity) {
                    graphData
                        .nodeList
                        .map(function (obj) { return obj.value; })
                        .filter(function (entity) { return _.isEqual(currentEntity, entity); })
                        .forEach(focusNeighbors);
                }

                /**
                 * Builds the D3 force layout graph
                 *
                 * The force layout graph doesn't actually draw anything to the screen, just adds properties to the
                 * given nodes and links objects to describe where they SHOULD be on the screen
                 *
                 * @param data - Same as the render's graphData argument.  Separate, in case we want to do filtering
                 * @param bounds - The size of the drawing area
                 */
                function buildForceLayout (data, bounds) {
                    return d3.layout
                             .force()
                             .size([ bounds.width, bounds.height ])
                             .nodes(data.nodeList)
                             .links(data.linkList)
                             // Node attraction to each other
                             .linkStrength(0)
                             // Maximum length between nodes
                             .linkDistance(50)
                             .charge(calculateCharge)
                             // This is what actually starts the animation.  Remove this and call later
                             // if you want this to just be a builder function
                             .start();
                }

                /**
                 * Draws the circles for each node and attaches listeners to them.
                 *
                 * @param nodeList
                 */
                function drawNode (nodeList) {
                    var defaultSize = 10;

                    function getCircleRadius (n) {
                        return isDefined(n) ? sizeByScale(n) : defaultSize;
                    }

                    // On click, focus entity and mark as the selected entity
                    function clickEvent (obj) {
                        function click () {
                            if ( utils.isDefined(d3.event) ) {
                                d3.event.preventDefault();
                                d3.event.stopPropagation();
                            }
                            obj.selected = true;
                            focus(obj);
                        }

                        scope.$apply(click);
                    }

                    var node = svg
                        .selectAll('.node')
                        .data(nodeList)
                        .enter().append('g')
                        // CSS is setup to style nodes different colors based on their type
                        .attr('class', function (d) { return 'node ' + d.value.type + '-node'; })
                        .on('click', clickEvent)
                        .call(forceLayout.drag);

                    // Appends circles to each node
                    node.append('circle')
                        .attr('r', getCircleRadius);

                    // Not sure why, but seems only after clicking on a node does text appear.  Probably a CSS thing
                    // Used to be a `wellconnected` property in the old code, but I didn't get around to implementing
                    // it in the re-write
                    node.append('text')
                        .text(function (d) { return isDefined(d.value.nickname) ? d.value.nickname : d.value.name; })
                        .attr('dx', function () { return (-0.065 * this.getComputedTextLength() / 2) + 'em'; })
                        .attr('dy', function () { return (0.08 * this.parentNode.getBBox().height / 2 + 0.5) + 'em'; });

                    return node;
                }

                /**
                 * Actually one of the expensive methods in here.  This will search for connected entities and add
                 * certain classes to them for CSS styling.  I'm not sure, but D3 probably has something for doing
                 * this for you, but I didn't check.
                 *
                 * @param entity
                 */
                function focusNeighbors (entity) {
                    function compareAgainstConnectionObj (d) {
                        return function (c) {
                            return d.source === c.index || d.target === c.index;
                        };
                    }

                    function neighboring (a) {
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

                /**
                 * Sets the given entity as the current entity selected in the app and then focuses
                 * it and its neighbors
                 * @param entity
                 */
                function focus (entity) {
                    if ( utils.isDefined(cgService.getCurrentEntity()) ) {
                        // If they are the same, then we don't need to do anything
                        if ( _.isEqual(cgService.getCurrentEntity(), entity.value) ) {
                            return;
                        }
                        // If not, then call unFocus to setup for new focused entity
                        else {
                            unFocus(entity);
                        }
                    }

                    cgService.setCurrentEntity(entity.value);

                    focusNeighbors(entity);
                }

                /**
                 * Clear out any selections made and set call unFocus
                 */
                function backgroundClick () {
                    if ( !utils.isDefined(cgService.getCurrentEntity()) ) {
                        return;
                    }

                    unFocus();
                    cgService.setCurrentEntity(null);
                }

                /**
                 * Clears out the classes attached by focus.  The other half of the function is leftover from when
                 * there was a feature for double clicking a node to freeze it in place, but after implementing it I
                 * felt it was stupid looking so I removed it, but left the stuff here because it doesn't actually do
                 * anything.
                 *
                 * @param entity
                 */
                function unFocus (entity) {
                    node
                        .classed('focused', false)
                        .classed('unfocused', false);

                    connection
                        .classed('focused', false)
                        .classed('unfocused', false);

                    if ( utils.isDefined(entity) ) {
                        entity.fixed = false;
                    }
                    else {
                        graphData.nodeList.forEach(function (d) {
                            d.fixed = false;
                        });
                    }

                    // Restart d3 animations.
                    if ( utils.isDefined(cgService.getCurrentEntity()) ) {
                        forceLayout.resume();
                    }
                }

                /**
                 * Draws the lines for each link between nodes
                 *
                 * @param connectionList
                 * @returns {*}
                 */
                function drawConnection (connectionList) {

                    // Not sure how useful exactly, but when looking at all data from the API, there are about
                    // 300 redundant connections, so probably not necessary, but could be useful down the road
                    // if the API is never updated to filter that for us.  Best case would be API doing this.
                    function removeRedundantConnectionFromList (conList) {
                        // Simpler than it looks.  Trust me, looks nicer in ES6.  I need to get around to doing that
                        // update First, converts to an obj of { source: source.id, target: target.id Then, create a
                        // map of source.id => array of target.id
                        var idMap = conList
                            .map(
                                function (obj) {
                                    return { source: obj.source.id, target: obj.target.id };
                                }
                            )
                            .reduce(
                                function (result, obj) {
                                    if ( result[ obj.source ] ) {
                                        result[ obj.source ].push(obj.target);
                                    }
                                    else {
                                        result[ obj.source ] = [ obj.target ];
                                    }
                                    return result;
                                },
                                {}
                            );
                        // Next, this function will filter out any connection that is already represented in the list
                        // but has the source and target swapped.
                        // Example: [{ source: 1, target: 2}, { source: 2, target: 1 }] => [{ source: 1, target: 2 }]
                        function findInIdMap (obj) {
                            return idMap[ obj.target.id ]
                                   || (
                                       idMap[ obj.target.id ]
                                       && idMap[ obj.target.id ]
                                              .find(function (sId) { return sId === obj.source.id; }) !== null
                                   );
                        }

                        return conList.filter(findInIdMap);
                    }

                    var filtered = removeRedundantConnectionFromList(connectionList);
                    return svg
                        .selectAll('.link')
                        .data(filtered)
                        .enter().append('line')
                        .attr('class', function (l) { return 'link ' + l.type + '-link '; });
                }
            }
        }

        return {
            'restrict': 'E',
            'link': LinkFn
        };
    }

    Directive.$inject = [
        '$window',
        '_',
        'cgUtilService',
        'cgMainService',
        'cgNetworkService'
    ];

    angular
        .module('civic-graph.network')
        .directive('cgNetworkGraph', Directive);

})(angular, d3);
