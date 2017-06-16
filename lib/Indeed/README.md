# indeed-jobs

A wrapper library to call Indeed  Jobs API in node.js. This is adapted from a very similar library  [Node-Indeed-API] : https://github.com/keannan5390/Node-Indeed-API

The changes are focused on using request library for making REST API calls instead of restler.

The Indeed API only supports 2 endpoints, there are 2 operations you can perform in the library.

- Job Search
- Get Jobs

###Usage

An instance of the api can be invoked by calling getInstance() and providing it your publisher id.

```js
var api = require('indeed-jobs-api').getInstance("YOUR-PUBLISHER-ID-HERE");
```

Rest of the documentation follows teh Node-Indeed-API Documentation.
