const express = require('express');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
require('./services/discordBot'); // Lance le bot Discord

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});