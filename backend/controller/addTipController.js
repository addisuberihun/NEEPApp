const StudyTip = require('../model/addTipModel');
const TeacherModel = require('../model/teacherRegisterModel');
const RecentActivity = require('../model/recentActivityModel');

const createStudyTip = async (req, res) => {
  try {
    const { category, level, title, description, subject } = req.body;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user token' });
    }

    if (!category || !level || !title || !description || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const teacher = await TeacherModel.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    if (teacher.subject !== subject) {
      return res.status(403).json({
        success: false,
        message: 'Teacher not authorized for this subject',
      });
    }

    const studyTip = new StudyTip({
      category,
      level,
      title,
      description,
      subject,
      createdBy: teacherId,
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
    });

    const savedTip = await studyTip.save();

    await RecentActivity.create({
      teacherId,
      activityType: 'tip_added',
      description: `Added a new study tip: "${title}" for ${subject}`,
      resourceId: savedTip._id,
    });

    res.status(201).json({
      success: true,
      data: savedTip,
    });
  } catch (error) {
    console.error('Error creating study tip:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create study tip.',
    });
  }
};

const getStudyTips = async (req, res) => {
  try {
    const { subject } = req.query;
    const query = subject ? { subject } : {};
    const tips = await StudyTip.find(query).populate('createdBy', 'name subject');
    res.status(200).json({
      success: true,
      data: tips,
    });
  } catch (error) {
    console.error('Error fetching study tips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study tips.',
    });
  }
};

const updateStudyTip = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, level, title, description, subject, action, studentId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user token' });
    }

    const tip = await StudyTip.findById(id);
    if (!tip) {
      return res.status(404).json({ success: false, message: 'Study tip not found' });
    }

    if (action) {
      // Handle like/dislike updates
      if (action === 'like') {
        if (tip.likedBy.includes(studentId)) {
          return res.status(400).json({ success: false, message: 'You have already liked this tip' });
        }
        if (tip.dislikedBy.includes(studentId)) {
          return res.status(400).json({ success: false, message: 'You cannot like a tip you have disliked' });
        }
        tip.likedBy.push(studentId);
        tip.likes = (tip.likes || 0) + 1;
      } else if (action === 'dislike') {
        if (tip.dislikedBy.includes(studentId)) {
          return res.status(400).json({ success: false, message: 'You have already disliked this tip' });
        }
        if (tip.likedBy.includes(studentId)) {
          return res.status(400).json({ success: false, message: 'You cannot dislike a tip you have liked' });
        }
        tip.dislikedBy.push(studentId);
        tip.dislikes = (tip.dislikes || 0) + 1;
      }
    } else {
      // Handle regular updates (e.g., by teacher)
      if (tip.createdBy.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this tip' });
      }
      if (!category || !level || !title || !description || !subject) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      const teacher = await TeacherModel.findById(userId);
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
      if (teacher.subject !== subject) {
        return res.status(403).json({
          success: false,
          message: 'Teacher not authorized for this subject',
        });
      }
      tip.category = category;
      tip.level = level;
      tip.title = title;
      tip.description = description;
      tip.subject = subject;
    }

    const updatedTip = await tip.save();

    if (!action) {
      await RecentActivity.create({
        teacherId: userId,
        activityType: 'tip_updated',
        description: `Updated study tip: "${title}" for ${subject}`,
        resourceId: updatedTip._id,
      });
    }

    res.status(200).json({
      success: true,
      data: updatedTip,
    });
  } catch (error) {
    console.error('Error updating study tip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study tip.',
    });
  }
};

const deleteStudyTip = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing user token' });
    }

    const tip = await StudyTip.findOneAndDelete({ _id: id, createdBy: teacherId });
    if (!tip) {
      return res.status(404).json({ success: false, message: 'Study tip not found or unauthorized' });
    }

    await RecentActivity.create({
      teacherId,
      activityType: 'tip_deleted',
      description: `Deleted study tip: "${tip.title}" for ${tip.subject}`,
      resourceId: tip._id,
    });

    res.status(200).json({
      success: true,
      message: 'Study tip deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting study tip:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete study tip.',
    });
  }
};

module.exports = {
  createStudyTip,
  getStudyTips,
  updateStudyTip,
  deleteStudyTip,
};