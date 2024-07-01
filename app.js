//const config = require('./config'); may be required in future
const express = require('express');
const app = express();
const path = require('path'); //check if this is required
const bookingsRouter = require('./controllers/bookings');
const healthRouter = require('./controllers/health');
const authRouter = require('./controllers/auth');
const middleware = require('./utils/middleware'); //may be required in future
const logger = require('./utils/logger');
const cookieParser = require('cookie-parser');
const xmlParser = require('express-xml-bodyparser');
const bodyParser = require('body-parser');
const morgan = require('morgan');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(xmlParser({trim: false, explicitArray: false}));

app.use(middleware.requestLogger);
app.use('/api/bookings', bookingsRouter);
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

morgan.token('body', function getBody(req) {
  return (req.method === 'POST' || req.method === 'PUT') ? JSON.stringify(req.body) : ' '
})

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    logger.error(err);
    res.sendStatus(err.status || 500);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.sendStatus(err.status || 500);
});

module.exports = app;