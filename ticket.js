const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5002;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Configuration
const db = mysql.createPool({
  connectionLimit: 10, // Adjust as needed
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'user_auth'
});

// Connect to MySQL
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1); // Exit the application if unable to connect to the database
  }
  console.log('Connected to MySQL');
  connection.release(); // Release the connection back to the pool
});

// Create Ticket
app.post('/api/tickets', (req, res) => {
  const { title, subject, description,  status } = req.body;
  const submitted = new Date().toISOString().slice(0, 10); // Current date

  const sql = 'INSERT INTO tickets (title, subject, description, submitted, status) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [title, subject, description, submitted, status], (err, result) => {
    if (err) {
      console.error('Error creating ticket:', err);
      return res.status(500).json({ error: 'Error creating ticket' });
    }

    res.status(201).json({ message: 'Ticket created successfully', id: result.insertId });
  });
});



// Get Tickets
app.get('/api/tickets', (req, res) => {
  const sql = 'SELECT * FROM tickets';
  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ error: 'Error fetching tickets' });
    }

    res.status(200).json(result);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
