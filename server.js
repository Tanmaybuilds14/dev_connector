
const express = require('express');
const connectDB = require('./config/db');
const app = express();

connectDB();

// JSON body parser
app.use(express.json());

app.get('/', (req, res) => res.send('API Running'));

// define routes (mount under /api)
app.use('/api/users', require('./Routes/users'));
app.use('/api/posts', require('./Routes/posts'));
app.use('/api/auth', require('./Routes/auth'));
app.use('/api/profile', require('./Routes/profile'));


 const PORT = process.env.PORT || 5000;
 app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
