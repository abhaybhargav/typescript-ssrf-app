import express from 'express';
import axios from 'axios';
import { User } from './user';
import { URL } from 'url';

const router = express.Router();

// In-memory storage for users
const users: User[] = [];

const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
console.log(`Using CouchDB URL: ${COUCHDB_URL}`);

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// Home page
router.get('/', (req, res) => {
  res.render('home');
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login post
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.redirect(`/dashboard/${user.id}`);
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

// Signup page (vulnerable)
router.get('/signup', (req, res) => {
  res.render('signup', { secure: false });
});

// Signup post (vulnerable)
router.post('/signup', async (req, res) => {
  const { username, password, blogUrl } = req.body;
  if (users.some(u => u.username === username)) {
    return res.render('signup', { error: 'Username already exists', secure: false });
  }
  const newUser: User = { id: users.length + 1, username, password, blogUrl };
  users.push(newUser);
  res.redirect('/login');
});

// Secure signup page
router.get('/secure-signup', (req, res) => {
  res.render('signup', { secure: true });
});

// Secure signup post
router.post('/secure-signup', async (req, res) => {
  const { username, password, blogUrl } = req.body;
  if (users.some(u => u.username === username)) {
    return res.render('signup', { error: 'Username already exists', secure: true });
  }
  
  // Validate URL
  const urlPattern = /^https:\/\/(?!192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|10\.|127\.).+$/;
  if (!urlPattern.test(blogUrl)) {
    return res.render('signup', { error: 'Invalid or insecure URL', secure: true });
  }
  
  const newUser: User = { id: users.length + 1, username, password, blogUrl };
  users.push(newUser);
  res.redirect('/login');
});

// Dashboard (vulnerable to SSRF)
router.get('/dashboard/:userId', async (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.userId));
  if (!user) {
    console.error(`User not found for ID: ${req.params.userId}`);
    return res.status(404).send('User not found');
  }
  
  try {
    console.log(`Fetching blog content from: ${user.blogUrl}`);
    const response = await axios.get(user.blogUrl);
    console.log(`Successfully fetched blog content for user: ${user.username}`);
    let blogContent;
    try {
      blogContent = JSON.stringify(response.data, null, 2);
    } catch (jsonError) {
      console.error(`Error stringifying response data: ${getErrorMessage(jsonError)}`);
      blogContent = String(response.data);
    }
    res.render('dashboard', { user, blogContent });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Error fetching blog content for user ${user.username}: ${errorMessage}`);
    res.render('dashboard', { user, blogContent: `Error fetching blog content: ${errorMessage}` });
  }
});

// Direct CouchDB access (for demonstration purposes)
router.get('/couchdb-direct', async (req, res) => {
  try {
    console.log(`Attempting to access CouchDB at: ${COUCHDB_URL}/_all_dbs`);
    const response = await axios.get(`${COUCHDB_URL}/_all_dbs`);
    console.log(`Successfully accessed CouchDB. Databases: ${JSON.stringify(response.data)}`);
    res.json(response.data);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Error accessing CouchDB: ${errorMessage}`);
    res.status(500).json({ error: `Error accessing CouchDB: ${errorMessage}` });
  }
});

// Database initialization route
router.get('/init-db', async (req, res) => {
  try {
    // Create database
    await axios.put(`${COUCHDB_URL}/sensitive_data`);
    console.log('Database created successfully');

    // Add sample documents
    const documents = [
      { _id: '1', type: 'user_credentials', username: 'admin', password: 'supersecret' },
      { _id: '2', type: 'api_key', service: 'payment_gateway', key: 'pk_live_abcdefghijklmnop' },
      { _id: '3', type: 'customer_data', name: 'John Doe', email: 'john@example.com', ssn: '123-45-6789' }
    ];

    for (const doc of documents) {
      await axios.put(`${COUCHDB_URL}/sensitive_data/${doc._id}`, doc);
      console.log(`Document ${doc._id} added successfully`);
    }

    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Error initializing database: ${errorMessage}`);
    res.status(500).json({ error: `Error initializing database: ${errorMessage}` });
  }
});

export { router };