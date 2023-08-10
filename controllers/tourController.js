const Tour = require('./../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));


/*exports.checkID = (req, res, next, val) => {

    console.log("ID is :", val);
    if (val > tours.length - 1) {
        return res.status(404).json({
            status: 'fail',
            message: 'Invalid ID'
        });

    }
    next();
};


// exports.checkBody = (req, res, next) => {
//
//     if (!req.body.name || !req.body.price) {
//         return res.status(400).json({
//             status: 'fail', message: 'Missing name or price'
//         });
//     }
//     next();
// };*/

exports.getToursStats = catchAsync(async (req, res, next) => {


    const stats = await Tour.aggregate([{
        $match: {ratingsAverage: {$gte: 4.5}}
    }, {
        $group: {
            _id: {$toUpper: '$difficulty'},
            numTours: {$sum: 1},
            numRating: {$sum: '$ratingsQuantity'},
            avgRating: {$avg: '$ratingsAverage'},
            avgPrice: {$avg: '$price'},
            minPrice: {$min: '$price'},
            maxPrice: {$max: '$price'},
        }
    }, {
        $sort: {avgPrice: 1}
    }, // {
        //     $match: {_id: {$ne: 'EASY'}}
        // }
    ]);

    res.status(200).json({
        status: "success", data: {
            stats
        }
    });

});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {

    const year = req.params.year * 1;

    const plan = await Tour.aggregate([{
        $unwind: '$startDates'
    }, {
        $match: {
            startDates: {
                $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`),
            }
        }
    }, {
        $group: {
            _id: {$month: '$startDates'}, numToursStart: {$sum: 1}, tours: {$push: '$name'}

        }
    }, {
        $addFields: {month: '$_id'}
    }, {
        $project: {
            _id: 0
        }
    }, {
        $sort: {numToursStart: -1}
    }, {
        $limit: 12
    }]);

    res.status(200).json({
        status: "success", results: plan.length, data: {
            plan
        }
    });

});

exports.aliasTopTours = (req, res, next) => {
    req.query.limit = 5;
    req.query.sort = '-ratingAverage,price';
    req.query.fields = 'name,price,ratingAverage,summary,difficulty';
    next();
};

/*exports.createTour = catchAsync(async (req, res, next) => {

    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: 'success', data: {tour: newTour}
    });

});*/

/*exports.getTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findById(req.params.id).populate('reviews');
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }
    // Tour.findOne({_id:req.params.id})

    res.status(200).json({
        status: "success", data: {tour}
    });

});*/

/*
exports.getAllTours = catchAsync(async (req, res, next) => {


    /!*BUILD QUERY
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
    }*!/

    const features = new APIFeatures(Tour.find(), req.query).filter().sort().limitFields().paginate();

    // const tours = await Tour.find()
    //     .where('duration')
    //     .equals(5)
    //     .where('difficulty')
    //     .equals('easy');

    const tours = await features.query;

    // const tours = await Tour.find();

    res.status(200).json({
        status: 'success', results: tours.length, data: {
            tours
        }
    });

});
*/

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {path: 'reviews'});
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

/*exports.deleteTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }
    res.status(204).json({
        status: "success", data: null
    });
});*/


// {{URL}}api/v1/tours/tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if (!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    });

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat,lng.', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        }, {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });


});