var IndeedJobsApi = require('./lib/indeed-jobs.js');

var Api = function()
{
    this.getInstance = function(publisherKey)
    {
        return new IndeedJobsApi(publisherKey);
    };
};

module.exports = new Api();
