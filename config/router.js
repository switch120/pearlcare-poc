const express = require('express');

module.exports = function(app)
{
    // Initializing route groups
    const apiRoutes = express.Router();

    //=========================
    // API Routes
    //=========================

    // var api = require('indeed-jobs-api').getInstance(process.env.PUBLISHER_ID);
    var api = require('../lib/Indeed').getInstance(process.env.PUBLISHER_ID);

    apiRoutes.post("/indeed", function(req, res)
    {
        var searchParams = req.body.search.length ? req.body.search.split(" ") : [];

        searchParams.push("pearlcare");

        // append the unique search identifier to organize results by their arbitrary category
        if (req.body.search_identifier) searchParams.push(req.body.search_identifier);

        var sObj = api.JobSearch()
            // .Radius(20)
            /*.WhereLocation({
                city : "Stevens Point",
                state : "WI"
            })
            .Limit(2)
            .WhereKeywords(["Information Technology"])*/
            .SortBy("date")
            .WhereKeywords(searchParams)
            .Limit(25)
            .UserIP("1.2.3.4")
            .UserAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36");

        if (req.body.postal_code) sObj.WhereLocation({ postalCode: req.body.postal_code });

        // add radius from zip if both postalCode and Radius specified
        if (req.body.radius && req.body.postal_code) sObj.Radius(req.body.radius);

        sObj.Search(
            function (results) {
                // do something with the success results
                res.send(results);
            },
            function (error) {
                // do something with the error results
                console.log(error);
            }
        );
    });

    // Set url for API group routes
    app.use('/api', apiRoutes);
};