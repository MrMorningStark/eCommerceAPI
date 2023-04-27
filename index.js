require("dotenv").config();
const cors = require('cors');
const express = require('express');
const app = express();

var corOptions = {
    // Sets Access-Control-Allow-Origin to the UI URI
    // origin: process.env.CLIENT_ROOT_URI,

    //allow all origins
    origin: "*",
    // Sets Access-Control-Allow-Credentials to true
    credentials: true,// <= Accept credentials (cookies) sent by the client
}
app.use(cors(corOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
    res.status(200).json({ message: "eccomerce API" });
});

//standard ports
//http - 80
//https - 443
const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
    console.log('server started on port ' + PORT);
})