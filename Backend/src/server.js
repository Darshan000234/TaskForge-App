require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const cookieParser = require('cookie-parser');
const userRoute = require('./routes/UserRoute.js');
const port = 3000;

app.use(cors({
    origin: process.env.URL,
    withCredentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/user',userRoute);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
