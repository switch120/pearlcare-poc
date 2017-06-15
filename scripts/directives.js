(function()
{
    ngApp.directive("loadingOverlay", function ()
    {
        return {
            restrict: "E",
            scope: {
                loading: "=",
            },
            template: '<div class="overlay-wrapper" ng-show="loading">' +
            '<div class="overlay">' +
            '<i class="fa fa-refresh fa-spin"></i>' +
            '</div>' +
            '</div>'
        };
    });
})();