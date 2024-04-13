const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables from .env file
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4005;
const jwt = require ("jsonwebtoken");

const { Pool } = require('pg');



// Middleware to parse JSON bodies
app.use(express.json());
const connection = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432, // Default PostgreSQL port
    ssl: {
        rejectUnauthorized: false, // Set to false if using self-signed certificates
        // You may need to provide other SSL options such as ca, cert, and key
        // Example:
        // ca: fs.readFileSync('path/to/ca-certificate.crt'),
        // cert: fs.readFileSync('path/to/client-certificate.crt'),
        // key: fs.readFileSync('path/to/client-certificate.key')
    },
});

connection.connect()
    .then(() => {
        console.log('Connected to PostgreSQL database');
    })
    .catch((err) => {
        console.error('Error connecting to PostgreSQL database', err);
    });

// Register endpoint
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const insertQuery = `INSERT INTO gaming_users (email, password) VALUES ($1, $2)`;
  connection.query(insertQuery, [email, password], (err, result) => {
    if (err) {
      console.error('Error registering user: ' + err.stack);
      res.status(500).send('Error registering user');
      return;
    }
    console.log('User registered successfully');
    res.status(200).send('User registered successfully');
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const selectQuery = `SELECT * FROM gaming_users WHERE email = $1 AND password = $2`;
  connection.query(selectQuery, [email, password], (err, result) => {
    if (err) {
      console.error('Error logging in: ' + err.stack);
      res.status(500).send('Error logging in');
      return;
    }
    if (result.rows.length === 0) {
      res.status(401).send('Invalid email or password');
    } else {
      const token = jwt.sign({ email }, 'SECRET');
      console.log('User logged in successfully');
      res.status(200).send({ token });
    }
  });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    res.status(401).send('Unauthorized request');
    return;
  }
  const verifiedToken = token.split(' ')[1];
  jsonwebtoken.verify(verifiedToken, 'SECRET', (err, decoded) => {
    if (err) {
      res.status(401).send('Unauthorized request');
      return;
    }
    req.decoded = decoded;
    next();
  });
};

// News Endpoint
app.get('/news/:id', (req, res) => {
  const { id } = req.params;
  const selectNewsQuery = `SELECT main_title, main_content, sub_title1, sub_content1, sub_title2, sub_content2 FROM news WHERE id =$1`;
  connection.query(selectNewsQuery, [id], (err, result) => {
    if (err) {
      console.error('Error fetching news: ', err);
      res.status(500).send('Error fetching news');
    } else {
      if (result.rows.length > 0) {
        res.status(200).send(result.rows[0]);
      } else {
        res.status(404).send('News not found');
      }
    }
  });
});
app.get('/news', (req, res) => {
  const selectAllNewsQuery = `SELECT * FROM news`;
  connection.query(selectAllNewsQuery, (err, result) => {
    if (err) {
      console.error('Error fetching news: ', err);
      res.status(500).send('Error fetching news');
    } else {
      res.status(200).json(result.rows);
    }
  });
});

app.post('/news', (req, res) => {
  const { main_title, main_content, sub_title1, sub_content1, sub_title2, sub_content2 } = req.body;
  const insertQuery = `INSERT INTO news (main_title, main_content, sub_title1, sub_content1, sub_title2, sub_content2) VALUES ($1, $2, $3, $4, $5, $6)`;
  connection.query(insertQuery, [main_title, main_content, sub_title1, sub_content1, sub_title2, sub_content2], (err, result) => {
    if (err) {
      console.error('Error inserting news: ', err);
      res.status(500).send('Error inserting news');
    } else {
      console.log('News inserted successfully');
      res.status(201).send('News inserted successfully');
    }
  });
});


// Logout endpoint
app.post("/logout", verifyToken, (req, res) => {
  res.status(200).send("Logged out successfully");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
