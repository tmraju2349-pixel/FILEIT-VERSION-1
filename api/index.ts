import express from "express";
import app from "../artifacts/api-server/src/app";

// Vercel may pass the function request with or without the /api prefix.
// Normalize both forms so the shared Express routes work unchanged.
const vercelApp = express();
vercelApp.use((req, _res, next) => {
  if (!req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }
  next();
});
vercelApp.use(app);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default vercelApp;