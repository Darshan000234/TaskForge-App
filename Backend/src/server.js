import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoute from './routes/UserRoute.js';
import orgRoute from './routes/OrgRoute.js';

dotenv.config();
const app = express();
const port = 3000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());

app.use('/user', userRoute);
app.use('/org', orgRoute);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
