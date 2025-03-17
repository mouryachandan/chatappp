const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/connectDB');
const router = require('./routes/index');
const cookieParser = require('cookie-parser');
const { app, server } = require('./socket/index');

// CORS Config
app.use(
    cors({
        origin: process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3000", // Default to localhost if env not set
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200 // Ensure legacy browsers handle pre-flight requests
    })
);


app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 8080;

app.get('/', (request, response) => {
    response.json({
        message: 'Server running at ' + PORT,
    });
});

// API endpoints
app.use('/api', router);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Connect DB and start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log('Server running at http://localhost:' + PORT);
    });
}).catch(err => {
    console.error('Failed to connect to DB:', err);
});
