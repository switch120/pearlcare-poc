// global app reference
var ngApp = angular.module("ngApp", ['ui.bootstrap']);

(function()
{
    ngApp.constant('API_URL', 'http://pearlcare-poc.dev:8080/api/');

    // config event
    ngApp.config(function ($httpProvider, $compileProvider, $locationProvider, $qProvider)
    {
        $locationProvider.html5Mode({
            enabled: true,
            rewriteLinks: false
        });

        // $httpProvider.defaults.withCredentials = true;

        // make sure to allow "data:" urls (exports)
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|data):/);

        // Stop the "Possibly unhandled rejection: undefined" messages for ignored rejects
        $qProvider.errorOnUnhandledRejections(false);
    });

    // app run event
    ngApp.run(function($rootScope, $http, $location, $window)
    {
        // base script url if needed
        $rootScope.script_url = $location.absUrl();

        /*var params = {
            v: 2,
            format: "json",
            userip: "1.2.3.4",
            q: "company: pearlcare",
            val: "JSON_CALLBACK",
            useragent: $window.navigator.userAgent
        };
        
        new apiHelper("indeed").get().then(function(output)
        {
            console.log(output);
        }, function(err)
        {
            console.log(["Error!", err]);
        });*/
    });
})();