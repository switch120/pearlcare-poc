(function()
{
    ngApp.controller("jobsController", function($scope, Jobs, $timeout)
    {
        var controller = this;

        this.service = Jobs;

        this.jobs = [];
        this.searchText = "";

        this.search = function()
        {
            Jobs.get({ search: controller.searchText }).then(function(data)
            {
                console.log(data);
                controller.jobs = data.results;
            });
        };

        $timeout(this.search);

    });
})();