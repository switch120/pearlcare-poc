module.exports = {
    // Secret key for JWT signing and encryption
    //'secret': process.env.JWT_SECRET,
    // Database connection information
    //'database': process.env.MONGODB_URI,
    'port': process.env.PORT || 8080,
    'cors': function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials");
        res.header("Access-Control-Allow-Credentials", "true");
        next();
    }
}