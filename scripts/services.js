(function(){

    ngApp.service("Jobs", function($rootScope, apiHelper)
    {
        var api = new apiHelper("indeed");

        return {
            helper: api,
            get: function(params)
            {
                return api.post(null, params);
            },
            // save: function(obj)
            // {
            //     return api.post("save", obj);
            // }
        };
    });

})();