/**
 * Created by brianavecchione on 7/11/16.
 */
(function (angular) {

    'use strict';

    function Directive() {
        return {
            "restrict": "E",
            "templateUrl": "/js/network/network.template.html",
            "controller": "networkCtrl"
        };
    }

    angular.module("civic-graph")
        .directive("network", Directive);

})(angular);
