const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/APIFeatures");

exports.deleteOne = Model =>
    catchAsync(async (req, res, next) => {

        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        res.status(204).json({
            status: "success", data: null
        });
    });

exports.updateOne = Model =>
    catchAsync(async (req, res, next) => {

        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true, runValidators: true
        });

        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }

        res.status(200).json({
            status: "success", data: {
                data: doc
            }
        });

    });


exports.createOne = Model =>
    catchAsync(async (req, res, next) => {

        const doc = await Model.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                data: doc
            }
        });
    });


exports.getOne = (Model, popOptions) =>
    catchAsync(async (req, res, next) => {

        let query = await Model.findById(req.params.id);
        if (popOptions) {
            query = query.populate(popOptions);
        }
        const doc = await query;
        if (!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
        // Tour.findOne({_id:req.params.id})

        res.status(200).json({
            status: "success",
            data: doc
        });

    });


exports.getAll = (Model) => catchAsync(async (req, res, next) => {


    /*BUILD QUERY
    // 1A) Filtering
    const queryObj = {...req.query};
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 2B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|ge|lte|lt)\b/, match => `$${match}`);

    // EXECUTE QUERY
    let query = Tour.find(JSON.parse(queryStr));

    // SORT DATA
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // SELECT ONLY SPECIFIC FIELDS
    if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        query = query.select(fields);
    } else {
        query = query.select('-__v');
    }

    // PAGINATION
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
        const numTours = await Tour.countDocuments();
        console.log("numTours : ------>", numTours);
        if (skip > numTours) {
            throw new Error('This page does not exist');
        }
    }*/


    // To allow for nested GET reviews on tour (hack 🙃)
    let filter = {};
    if (req.params.tourId) {
        filter = {tour: req.params.tourId};
    }

    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();

    // const tours = await Tour.find()
    //     .where('duration')
    //     .equals(5)
    //     .where('difficulty')
    //     .equals('easy');

    // const doc = await features.query.explain();
    const doc = await features.query;

    // const doc = await Tour.find();

    res.status(200).json({
        status: 'success', results: doc.length, data: {
            data: doc
        }
    });

});