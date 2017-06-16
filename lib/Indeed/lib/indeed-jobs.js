var jobSearch   = require('./api/search.js'),
    getJobs     = require('./api/getjobs.js');

var missingPublisherIdError = "A publisher id is required!";

var domain = "api.indeed.com/ads";

module.exports = function (publisherId) {
	if (!publisherId)
		throw missingPublisherIdError;

	this.JobSearch = function () {
		return new jobSearch(domain, publisherId);
	};

	this.GetJob = function () {
        return new getJobs(domain, publisherId);
    };
};
