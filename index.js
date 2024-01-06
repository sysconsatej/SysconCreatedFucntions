var createError = require('http-errors');
require('dotenv').config();
var express = require('express');
const fileUpload = require('express-fileupload');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');

var flash = require('connect-flash');
// const connection=require('./src/config/MongoConnection');
var cors = require('cors');
var app = express()
app.use(fileUpload({
  createParentPath: true
}));
app.use(cors());
app.use(cookieParser());
app.use(session({ secret: '123', resave: false, saveUninitialized: false }));

app.use(flash());
var sessionFlash = function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();

}
app.use(sessionFlash)
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/site', express.static('static'));

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, 'public')));
const BalanceRouter = require('./src/routes/Balancereport');
const tblRouert = require('./src/routes/tblRoutes');
const MasterRouter = require('./src/routes/master');
const FormRouter = require('./src/routes/FormRoute');
const menuRouter = require('./src/routes/menuRoute');
const roleRouter = require('./src/routes/roleRouter');
const userRouter = require('./src/routes/userRoute');
const NoGenerationRoutes = require('./src/routes/NoGenerationRoutes');
const dynamicRouterMiddleware = require('./src/routes/SingleinsertRoute'); // Adjust path as needed
//const dynamicRouterMiddleware = require('./src/routes/SingleinsertRoute') 

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.post('/api/insertdata', dynamicRouterMiddleware);
// Unified endpoint for dynamic routing
// Unified endpoint for dynamic routing
// Dynamic router middleware
// const dynamicRouterMiddleware = (req, res, next) => {
//     const routeName = req.body.routeName;
//     console.log(routeName);
//     console.log('Received request on /api/insertdata with routeName:', req.body.routeName);

//     switch (routeName) {
//         case 'balancereport':
//             BalanceRouter(req, res, next);

//             break;
//         case 'tbl':
//             tblRouert(req, res, next);
//             break;
//         case 'master':
//             MasterRouter(req, res, next);
//             break;
//         case 'FormRoute':
            
          
//            // app.use("/api/FormControl", FormRouter);
           
//                 req.url = '/add';  // Redirect to the 'add' path 
//                 //req.method = 'POST';  // Ensure the method is POST
            
//             return next('route');  // Continue to the next route that matches the new URL

//         case 'menucontrol':
//             menuRouter(req, res, next);
//             break;
//         case 'rolecontrol':
//             roleRouter(req, res, next);
//             break;
//         case 'usercontrol':
//             userRouter(req, res, next);
//             break;
//         default:
//             res.status(404).send('Route not found');
//     }
// };

// Unified endpoint for insert data
//app.post('/api/insertdata', dynamicRouterMiddleware); 
app.use('/form', FormRouter);
app.use("/api/balancereport", BalanceRouter);
app.use("/api/tbl", tblRouert);
app.use("/api/master", MasterRouter);
app.use("/api/FormControl", FormRouter);
app.use("/api/menuControl", menuRouter);
app.use("/api/roleControl", roleRouter);
app.use("/api/userControl", userRouter);
app.use("/api/NoGeneration", NoGenerationRoutes);




// Route delegation based on a path parameter


// Export the unified router
//module.exports = unifiedRouter;

app.use(function (req, res, next) {
  next(createError(404));
});
// console.log("connection", connect);
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.removeHeader('X-Powered-By');
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

  res.locals.message = err.message;
  console.log(err.message);
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page

  res.status(err.status || 500);
  res.send({ success: false, message: 'Api Not Found', data: [] });
});

module.exports = app;