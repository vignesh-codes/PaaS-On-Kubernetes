import express from "express";
import http from "http";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import routers from "./router";
import { accessLogger, Logger } from "./loggers/logger";
import { MongoDB } from "./db/initdb";

MongoDB.initDb()
const app = express();

app.use(accessLogger);

app.use(cors({
    credentials: true,
}))

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);

server.listen(5000, () => {
    Logger.Info(`Server is running on port 5000`);
    console.log("server running on http://localhost:5000");
});


const { v1router, v2router } = routers();


app.use("/v1", v1router);
app.use("/v2", v2router);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    Logger.Error(err.stack || err.message || JSON.stringify(err));
    res.status(500).send('Something went wrong!');
});
