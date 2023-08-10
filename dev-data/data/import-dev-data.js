const fs = require("fs");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require("../../models/tourModel");
const Review = require("../../models/reviewModel");
const User = require("../../models/userModel");

// dotenv.config({path: './config.env'});
dotenv.config({path: './../../config.env'});

console.log(process.argv);
console.log("------------------------------------------------------------", process.env.DATABASE);
console.log(process.env);
console.log("------------------------------------------------------------");

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);


mongoose.connect(DB).then(() => console.log('---------------------- DB Connection Successful! ----------------------'));
//  Read JSON file


const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
// Import Data to DB

const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, {validateBeforeSave: false});
        await Review.create(reviews);
        console.log('Data Successfully Loaded!!');
    } catch (err) {
        console.log(err);
    }
    process.exit();

};
// Delete Data from DB

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data Successfully Deleted!!');
    } catch (err) {
        console.log(err);
    }
    process.exit();


};
if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();


}