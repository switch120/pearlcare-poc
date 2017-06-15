(function()
{
    ngApp.factory("AppConfig", function(API_URL)
    {
        // var _baseFolder = "/views/Angular/";

        return {
            api_url: API_URL,
            api_port: 8080
            // viewFolder: _baseFolder,
            // componentViewFolder: _baseFolder + "app/",
        };
    });

    ngApp.factory("apiHelper", function($http, $q, $timeout, AppConfig)
    {
        // make sure the CSRF token gets sent with each request
        var defaultConfig = {
            headers: {
                //'X-CSRF-TOKEN': Laravel.csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        };

        return function(endpoint)
        {
            var _successResponder = function(resp)
            {
                var response = resp.data;

                if (response.notify)
                {
                    alert(response.notify);
                    delete response.notify;
                }

                if (service.deferred) service.deferred.resolve(response);
                _cleanup();

                return response;
            };

            var _errorResponder = function(resp)
            {
                var response = resp.data,
                    code = resp.status;

                // Laravel returns an array of errors when using the Validator
                switch (code)
                {
                    case 500:
                        service.errors = { "error": ["A Fatal Error has occurred processing your request. This has been logged for review."]};

                        // need to override the response since it's usually HTML of some kind
                        response = service.errors;
                        break;

                    case 403:
                        service.errors = { "error": [response.notify ? response.notify : "You do not have permissions to access this resource"] };
                        break;

                    case 404:
                        service.errors = { "error": ["Resource not found"] };
                        break;

                    case 405:
                        service.errors = { "error": ["Security Gate Exception; no authorized access"] };
                        break;

                    // unprocessable
                    case 422:
                        service.errors = response.error ? {"error": (angular.isArray(response.error[0]) ? response.error[0] : response.error) } : response;
                        break;
                }

                service.httpError = code;

                if (service.deferred) service.deferred.reject(response);
                _cleanup();

                return [response, code];
            };

            // returns a deferred for the helper
            var _init = function(deferred)
            {
                // var def = $q.defer();

                service.deferred = deferred;

                service.loading = true;
                service.errors = null;
                service.httpError = null;
            };

            var _checkConcurrent = function()
            {
                // because services are singletons, a deferred may already exist for the same service; wait for it, then make the next request in series
                if (service.deferred)
                {
                    return service.deferred.promise;
                }
                else
                {
                    var def = $q.defer();
                    def.resolve();

                    return def.promise;
                }
            };

            var _cleanup = function(response)
            {
                service.loading = false;
                service.deferred = null;
            };

            var service = {};

            service.config = angular.copy(defaultConfig);
            service.loading = false;
            service.httpError = null;
            service.errors = null;
            service.endpoint = AppConfig.api_url + endpoint;
            service.info = {};

            service.successCallback = _successResponder;
            service.errorCallback = _errorResponder;

            // used as the current deferred object (if any)
            service.deferred = null;

            service.get = function(action, config)
            {
                var def = $q.defer();

                _checkConcurrent().then(function()
                {
                    _init(def);
                    $http.get(service.endpoint + (action ? "/" + action : ""), angular.extend({}, defaultConfig, config)).then(_successResponder, _errorResponder);
                }, function(error){
                    console.log('get concurrent error', error);
                });

                return def.promise;
            };

            service.post = function(action, data, config)
            {
                var def = $q.defer();

                _checkConcurrent().then(function()
                {
                    _init(def);
                    $http.post(service.endpoint + (action ? "/" + action : ""), data, angular.extend({}, defaultConfig, config)).then(_successResponder, _errorResponder);
                }, function(error){
                    console.log('post concurrent error', error);
                });

                return def.promise;
            };

            return service;
        };
    });

    // localStorage cache abstraction
    ngApp.factory("LocalCache", function($q)
    {
        // return constructor as injector
        return function(cacheKey, timeout)
        {
            // timeout of 0 means never expires; default: 2m
            if (!angular.isDefined(timeout)) timeout = (60*2*1000);

            var _this = this;

            this.checkExpires = function(ms)
            {
                var q = new $q.defer();
                var obj = null;

                // override if specified
                if (ms) timeout = ms;

                try
                {
                    var _results = localStorage.getItem(cacheKey);

                    obj = JSON.parse(_results);

                    // has expiration, not found, or older than timeout; throw an error to reload from the db
                    if (!angular.isObject(obj) || !obj.cacheTimestamp || (timeout != 0 && Math.abs(new Date() - new Date(obj.cacheTimestamp)) > timeout )) throw true;

                    q.resolve(obj);
                }
                catch (exc)
                {
                    q.reject();
                }

                return q.promise;
            };

            this.store = function(obj)
            {
                // need to copy it since we're adding a parameter (will fire watches with 3rd parameter true!)
                var cObj = angular.copy(obj);

                // set a timestamp
                cObj.cacheTimestamp = new Date();

                // store it in the local cache
                localStorage.setItem(cacheKey, JSON.stringify(cObj));
            };
        }
    });

    // factory to control paging; per page, total, filtered, displayed - also filters entries
    ngApp.factory("PagingHelper", function($timeout, $filter)
    {
        var _emptyCheck = function(prop)
        {
            var found = false;

            angular.forEach(prop, function(sProp)
            {
                if (found) return;

                if (angular.isObject(sProp))
                {
                    // recursion
                    found = !_emptyCheck(sProp);
                }
                else
                {
                    found = typeof(sProp) != "undefined" && sProp != null && (sProp == true || !isNaN(parseInt(sProp)) || sProp.length);
                }
            });

            return !found;
        };

        var _filter = function(collection, filterObj)
        {
            //var cClone = angular.copy(collection);
            var tmp = [];

            // root-level objects are and'ed together, and sub-objects are or'd (these are all sub-objects)
            angular.forEach(filterObj, function(baseFilter, baseFilterKey)
            {
                // traverse each root-level object and create a single filter object out of it
                var filters = _filterRecurse(baseFilter, baseFilterKey);

                angular.forEach(filters, function(f)
                {
                    var results = $filter("filter")(collection, f, _isExact(f));
                    if (results.length) tmp = angular.extend([], results, tmp);
                });
            });

            return tmp;
        };

        var _isExact = function(obj)
        {
            var val = false;

            // exact match numeric
            if (!angular.isObject(obj)) return !isNaN(obj);

            angular.forEach(obj, function(sObj)
            {
                val = _isExact(sObj);
            });

            return val;
        };

        var _filterRecurse = function(filterObj, key)
        {
            var newFilter = {};

            // returns an array
            if (angular.isObject(filterObj)) // && Object.keys(filterObj).length > 1)
            {
                // this object has multiple properties - need to return an array of objects
                var props = [];

                angular.forEach(filterObj, function(f, k)
                {
                    //var fProps = _filterRecurse(f, k);

                    angular.forEach(_filterRecurse(f, k), function(p)
                    {
                        var obj = {};
                        obj[key] = p;

                        props.push(obj);
                    });
                });

                // returning an array
                return props;
            }
            else
            {
                // returns an object array
                var obj = {};
                obj[key] = filterObj;

                return [obj];
            }
        };

        // return instantiable object
        return function(options)
        {
            var factory = this;

            var def_options =
                {
                    perPage: 10,
                    // TODO - load from service
                    loadMoreCallback: function() {}
                };

            // override default options with passed options object
            this.options = angular.extend({}, def_options, options);

            this.currentPage = 1;

            // init; more for readability than anything else
            this.entries = [];

            this.filteredEntries = [];
            this.displayedEntries = [];

            // used for serverside paging
            this.totalEntries = 0;

            // ease of use wrapper
            this.setEntries = function(entryCollection, fragment)
            {
                factory.entries = entryCollection;
                if (fragment) factory.displayedEntries = factory.entries;
            };

            this.setPagedData = function(data, pageIndex)
            {
                factory.totalEntries = data.total;
                factory.currentPage = pageIndex;
                factory.setEntries(data.data, true);
            };

            this.appendEntries = function(entryCollection)
            {
                angular.extend(factory.entries, entryCollection);
            };

            // fills the displayedEntries property (used commonly in ng-repeat with a pr-paging-helper directive for pagination)
            this.pageChanged = function()
            {
                if (!factory.filteredEntries || !factory.filteredEntries.length)
                {
                    factory.displayedEntries = [];
                    return;
                }

                $timeout(function()
                {
                    // copy the filtered entries, then slice out a page to display
                    var tmp = angular.copy(factory.filteredEntries);

                    if (!factory.filteredEntries.length) return;

                    factory.displayedEntries = tmp.splice(factory.options.perPage * (factory.currentPage-1), factory.options.perPage);
                });
            };

            this.applyFilters = function(filters)
            {
                // return of nothing to filter (clear the filtered/displayed first)
                if (!factory.entries || !factory.entries.length)
                {
                    factory.filteredEntries = factory.displayedEntries = [];
                    return;
                }

                //factory.currentPage = 1;

                var filtered = angular.copy(factory.entries);

                var ct = 0;

                // array of object-filters (json)
                angular.forEach(filters, function(filterObj, filterIndex)
                {
                    var empty = _emptyCheck(filterObj);

                    if (!empty)
                    {
                        ct++;

                        // trickle-filter results from the root recursion (limits on each term)
                        //filtered = _recurse(filtered, filterObj);
                        filtered = _filter(filtered, filterObj);
                    }
                });

                // counter only gets incremented if the filter isn't empty
                if (!ct) filtered = angular.copy(factory.entries);

                factory.filteredEntries = filtered;
                factory.pageChanged();
            };

            this.setFilterValues = function (filterObj, value)
            {
                if (!angular.isObject(filterObj))
                {
                    return value;
                }

                // loop through all the properties
                angular.forEach(filterObj, function (_obj, key)
                {
                    if (angular.isObject(_obj))
                    {
                        filterObj[key] = factory.setFilterValues(_obj, value);
                    }
                    else
                    {
                        // eventually set all search properties to the same model value
                        filterObj[key] = value;
                    }
                });

                return filterObj;
            };
        };
    });

})();