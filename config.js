exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://deepbsd:2D33p4m3@ds035806.mlab.com:35806/blogapp';
exports.PORT = process.env.PORT || 8080;
