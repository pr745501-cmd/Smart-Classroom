const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  studentId: String,
  studentName: String,
  fileUrl: String,
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'Submitted' }
});

module.exports = mongoose.model('Submission', submissionSchema);
