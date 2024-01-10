const { Sequelize } = require('sequelize');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Adaugă cors

const eventRoutes = require('./routes/eventRoutes');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

const app = express();

app.use(cors()); // Adaugă cors() aici
app.use(bodyParser.json());

// Sync the models with the database
sequelize.sync()
  .then(() => {
    console.log('Database synchronized successfully');
  })
  .catch((error) => {
    console.error('Error synchronizing database:', error);
  });

// Add routes
app.use('/events', eventRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
