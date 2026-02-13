require('dotenv').config();

const express = require('express');
const { PrismaClient } = require("@prisma/client");
const cors = require('cors');
const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(cors({
    origin: process.env.URL,
    withCredentials: true
}));

app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
