# vaccine-exercise

Quick start frontend in development mode. It connects to backend which works on Heroku.
```
$ cd webfrontend
$ npm install
$ npm start
```

To start backend locally.
```
$ cd backend
$ node index.js
```
To start frontend with local backend, change REACT_APP_SERVER variable in frontend's .env file to:
```
REACT_APP_SERVER=http://localhost:5000
```
