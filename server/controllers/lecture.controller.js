const Lecture = require('../models/Lecture');

/* ADD LECTURE (Faculty later, abhi Postman) */
exports.addLecture = async (req, res) => {
  try {
    const lecture = new Lecture(req.body);
    await lecture.save();

    res.status(201).json({
      success: true,
      message: 'Lecture added',
      lecture
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* GET LECTURES FOR STUDENT */
exports.getLectures = async (req, res) => {
  try {
    const lectures = await Lecture.find({ course: 'BCA' }).sort({ date: -1 });

    res.json({
      success: true,
      lectures
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
