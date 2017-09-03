/**
 *
 * Created by brianavecchione on 6/27/16.
 */

(function (angular) {

    "use strict";

    function Directive() {
        return {
            templateUrl: "js/edit-entity/edit.html",
            restrict   : "E",
            scope      : {
                "entities": "=",
                "isOpen"  : "="
            },
            controller : "editCtrl"
        };
    }

    angular
        .module("civic-graph")
        .directive("editEntity", Directive);

})(angular);
