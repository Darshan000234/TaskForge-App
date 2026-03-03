import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoute from './routes/User/UserRoute.js';
import orgRoute from './routes/Organization/OrgRoute.js';

dotenv.config();
const app = express();
const port = 3000;
const URL = process.env.CLIENT_URL;


app.use(cors({
    origin: `${URL}`,
    credentials: true
}));


app.use(express.json());
app.use(cookieParser());

app.use('/user', userRoute);
app.use('/orgs', orgRoute);

const server = http.createServer(app);

const io = new Server(server,{
    cors : {
        origin: `${URL}`,
        credentials: true
    }
})

io.on("connection",(socket)=>{
    console.log("user connected: ",socket.id);
    
    socket.on("disconnect",()=>{
        console.log("user disconnected: ",socket.id);
    })
})
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export { io };