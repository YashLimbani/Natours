const dotenv = require('dotenv');
const app = require('./app');

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({path: './config.env'});

const mongoose = require('mongoose');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(() => console.log('---------------------- DB Connection Successful! ----------------------'));
// const testTour = new Tour({name: "The Park Camper", price: 850});

// testTour.save().then(doc => console.log(doc)).catch(err => console.error(err));
// console.log(process.env);
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`App running on the port ${PORT}`);
});

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 shutting down...');
    console.log(err);
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});