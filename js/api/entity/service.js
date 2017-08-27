/**
 * Created by brianavecchione on 6/27/16.
 */
(function (angular) {

    "use strict";

    function isDefined(o) {
        return !(typeof o === "undefined" || o === null);
    }

    function isObject(o) {
        return isDefined(o) && !Array.isArray(o) && (typeof o === "object");
    }

    function getPropertyFromObj(obj) {
        var defObj = isDefined(obj) ? obj : {};

        return function (property, defaultValue) {
            var value = isDefined(defaultValue) ? defaultValue : null;
            return isDefined(defObj[property])
                ? defObj[property]
                : value;
        };
    }

    function getEntityTypes() {
        return {
            "Government": true,
            "For-Profit": true,
            "Non-Profit": true,
            "Individual": true
        };
    }

    function getInfluenceTypes() {
        return ["Local", "National", "Global"];
    }

    function loopAndInit(modelArray, initModelFunction) {
        var newArray = Array.isArray(modelArray)
            ? modelArray.filter(isObject).map(initModelFunction)
            : [];

        return newArray.concat([initModelFunction()]);
    }

    function Entity(obj, funConnService, connService, financeService, locationService, categoryService) {
        var self = this;
        var defObj = isDefined(obj) ? obj : {};
        var getProperty = getPropertyFromObj(obj);

        function generateDBModel() {
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

            return dbModel;
        }

        self.id = getProperty("id");
        self.name = getProperty("name");
        self.influence = getProperty("influence");
        self.type = getProperty("type");
        self.nickname = getProperty("nickname");
        self.url = getProperty("url");
        self.twitter_handle = getProperty("twitter_handle");
        self.employees = getProperty("employees");

        self.locations = loopAndInit(defObj.locations, locationService.getLocationModel);
        self.grants_received = loopAndInit(defObj.grants_received, funConnService.getFundingConnectionModel);
        self.investments_received = loopAndInit(defObj.investments_received, funConnService.getFundingConnectionModel);
        self.grants_given = loopAndInit(defObj.grants_given, funConnService.getFundingConnectionModel);
        self.investments_made = loopAndInit(defObj.investments_made, funConnService.getFundingConnectionModel);
        self.data_given = loopAndInit(defObj.data_given, connService.getConnectionModel);
        self.data_received = loopAndInit(defObj.data_received, connService.getConnectionModel);
        self.collaborations = loopAndInit(defObj.collaborations, connService.getConnectionModel);
        self.key_people = loopAndInit(defObj.key_people, connService.getConnectionModel);
        self.employments = loopAndInit(defObj.employments, connService.getConnectionModel);
        self.revenues = loopAndInit(defObj.revenues, financeService.getFinanceModel);
        self.expenses = loopAndInit(defObj.expenses, financeService.getFinanceModel);
        self.categories = loopAndInit(defObj.categories, categoryService.getCategoryModel);

        self.generateDBModel = generateDBModel;
    }

    function Service(apiCaller, funConnService, connService, financeService, locationService, categoryService) {
        function getEntityModel(obj) {
            return new Entity(obj, funConnService, connService, financeService, locationService, categoryService);
        }

        function getAll() {
            return apiCaller.get('/entities');
        }

        function saveEntity(entity) {
            return apiCaller.post("/save", { "entity": entity });
        }

        return {
            "getEntityModel": getEntityModel,
            "getEntityTypes": getEntityTypes,
            "getInfluenceTypes": getInfluenceTypes,
            "getAll": getAll,
            "saveEntity": saveEntity
        };
    }

    Service.$inject = [
        "cgApiCaller",
        "fundingConnectionService",
        "connectionService",
        "financeService",
        "locationService",
        "categoryService"
    ];

    angular
        .module("civic-graph.api")
        .factory("entityService", Service);

})(angular);
