require('dotenv').config();

const express = require('express');
const path = require('path');
const routes = require('./routes');

require('./db');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API routes (no prefix)
app.use(routes);

// Fallback: redirect all other requests to index.html
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next)=>{
    if(err){
        console.error(err);
        return res.status(500).json({message: "Internal Server error"});
    }

    next();
})

// This module exports the app for testing purposes.
module.exports = app;
