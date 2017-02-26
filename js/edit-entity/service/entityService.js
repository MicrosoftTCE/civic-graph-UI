/**
 * Created by brianavecchione on 6/27/16.
 */

(function (angular) {

    'use strict';

    var entityServiceDependencies = [
        '$http',
        'fundingConnectionService',
        'connectionService',
        'financeService',
        'locationService',
        'categoryService',
        'config',
        '$q',
        EntityService
    ];

    function EntityService($http, fundingConnectionService, connectionService, financeService, locationService,
                           categoryService, config, $q) {

        var entityTypes = {
            'Government': true,
            'For-Profit': true,
            'Non-Profit': true,
            'Individual': true
        };

        var influenceTypes = [
            'Local',
            'National',
            'Global'
        ];

        function isDef(o) {
            return o !== undefined && o !== null;
        }

        function loopAndInit(modelArray, initModelFunction) {
            if (!( isDef(modelArray) || angular.isArray(modelArray) )) return [initModelFunction()];
            var arrayIndex,
                arrayValue,
                newModelArray = [];

            for (arrayIndex in modelArray) {
                if (!modelArray.hasOwnProperty(arrayIndex)) continue;
                arrayValue = modelArray[arrayIndex];

                if (!angular.isObject(arrayValue)) continue;

                newModelArray.push(initModelFunction(arrayValue));
            }
            newModelArray.push(initModelFunction());

            return newModelArray;
        }

        function Entity(obj) {
            var self = this;
            var defObj = isDef(obj) ? obj : {};
            // TODO: Do a loop to generate these locations as models, in order to use the functions in model
            // this.locations = (isDef(defObj.locations) ? defObj.locations : [locationService.getLocationModel()]);
            // TODO: Do this for every array in this model
            this.id = (isDef(defObj.id) ? defObj.id : null);
            this.name = (isDef(defObj.name) ? defObj.name : null);
            this.locations = loopAndInit(defObj.locations, locationService.getLocationModel);
            this.influence = (isDef(defObj.influence) ? defObj.influence : null);
            this.grants_received = loopAndInit(defObj.grants_received, fundingConnectionService.getFundingConnectionModel);
            this.investments_received = loopAndInit(defObj.investments_received, fundingConnectionService.getFundingConnectionModel);
            this.grants_given = loopAndInit(defObj.grants_given, fundingConnectionService.getFundingConnectionModel);
            this.investments_made = loopAndInit(defObj.investments_made, fundingConnectionService.getFundingConnectionModel);
            this.data_given = loopAndInit(defObj.data_given, connectionService.getConnectionModel);
            this.data_received = loopAndInit(defObj.data_received, connectionService.getConnectionModel);
            this.collaborations = loopAndInit(defObj.collaborations, connectionService.getConnectionModel);
            this.key_people = loopAndInit(defObj.key_people, connectionService.getConnectionModel);
            this.employments = loopAndInit(defObj.employments, connectionService.getConnectionModel);
            this.revenues = loopAndInit(defObj.revenues, financeService.getFinanceModel);
            this.expenses = loopAndInit(defObj.expenses, financeService.getFinanceModel);
            this.categories = loopAndInit(defObj.categories, categoryService.getCategoryModel);
            this.type = (isDef(defObj.type) ? defObj.type : null);
            this.nickname = (isDef(defObj.nickname) ? defObj.nickname : null);
            this.url = (isDef(defObj.url) ? defObj.url : null);
            this.twitter_handle = (isDef(defObj.twitter_handle) ? defObj.twitter_handle : null);
            this.employees = (isDef(defObj.employees) ? defObj.employees : null);
            // this.relations = loopAndInit(defObj.relations, connectionService.getConnectionModel);


            this.generateDBModel = function () {
                var dbModel = new Entity(self);
                dbModel.locations.pop();
                dbModel.locations.pop();
                dbModel.grants_received.pop();
                dbModel.grants_received.pop();
                dbModel.grants_given.pop();
                dbModel.grants_given.pop();
                dbModel.investments_received.pop();
                dbModel.investments_received.pop();
                dbModel.investments_made.pop();
                dbModel.investments_made.pop();
                dbModel.data_given.pop();
                dbModel.data_given.pop();
                dbModel.data_received.pop();
                dbModel.data_received.pop();
                dbModel.collaborations.pop();
                dbModel.collaborations.pop();
                dbModel.key_people.pop();
                dbModel.key_people.pop();
                dbModel.employments.pop();
                dbModel.employments.pop();
                dbModel.revenues.pop();
                dbModel.revenues.pop();
                dbModel.expenses.pop();
                dbModel.expenses.pop();
                dbModel.categories.pop();
                dbModel.categories.pop();
                dbModel.description = '';
                console.log(dbModel);

                return dbModel;
            };

        }

        function getEntityModel(obj) {
            return new Entity(obj);
        }

        function getEntityTypes() {
            return entityTypes;
        }

        function getInfluenceTypes() {
            return influenceTypes;
        }

        function getFromAPI() {
            return $http.get(config.apiHost + 'api/entities').then(function(response){
                return response.data;
            });
            // var defer = $q.defer();
            // defer.resolve({
            //     "nodes": [
            //         {
            //             "categories": [
            //                 {"id": 3, "name": "General Civic Tech"},
            //                 {"id": 4, "name": "Social Services"},
            //                 {"id": 5, "name": "Jobs & Education"},
            //                 {"id": 6, "name": "GovTech"}
            //             ],
            //             "collaborations": [
            //                 {"details": null, "entity": "Alexander Howard", "entity_id": 290, "id": 911}
            //             ],
            //             "data_given": [],
            //             "data_received": [],
            //             "description": "I create experiences / services that solve public problems. Also - Adjunct Professor at @NYU_Wagner",
            //             "employees": null,
            //             "employments": [],
            //             "expenses": [],
            //             "followers": 1655,
            //             "grants_given": [],
            //             "grants_received": [],
            //             "id": 0,
            //             "influence": "Local",
            //             "investments_made": [],
            //             "investments_received": [],
            //             "key_people": [],
            //             "locations": [
            //                 {
            //                     "address_line": null,
            //                     "coordinates": [40.782, -73.8317],
            //                     "country": "United States",
            //                     "country_code": "US",
            //                     "district": "NY",
            //                     "full_address": "New York, NY",
            //                     "id": 0,
            //                     "locality": "New York",
            //                     "postal_code": null
            //                 }
            //             ],
            //             "name": "Yasmin Fodil",
            //             "nickname": "Yasmin",
            //             "relations": [],
            //             "revenues": [],
            //             "twitter_handle": "@yasminfodil",
            //             "type": "Individual",
            //             "url": "http://yasminfodil.com"
            //         }
            //     ]
            // });
            // return defer.promise;
        }

        return {
            "getEntityModel": getEntityModel,
            "getEntityTypes": getEntityTypes,
            "getInfluenceTypes": getInfluenceTypes,
            "getFromAPI": getFromAPI
        };
    }

    angular.module('civic-graph')
        .service('entityService', entityServiceDependencies);


})(angular);
