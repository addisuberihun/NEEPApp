const Note = require('../model/noteModel');
const RecentActivity = require('../model/recentActivityModel');

exports.createNote = async (req, res) => {
  try {
    const { title, description, subject, grade, chapter } = req.body;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user token' });
    }

    if (!title || !subject || !grade || !chapter) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newNote = new Note({
      title,
      description,
      subject,
      grade,
      chapter,
      createdBy: teacherId
    });

    const savedNote = await newNote.save();

    const activity = new RecentActivity({
      teacherId: teacherId,
      activityType: 'note_added',
      description: `Added a new note: "${title}" for ${subject} (Grade ${grade})`,
      resourceId: savedNote._id,
    });

    await activity.save();

    res.status(201).json({ message: 'Note created successfully', note: savedNote });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ message: 'Error creating note', error: error.message });
  }
};

exports.getAllNotes = async (req, res) => {
  try {
    const { subject, grade } = req.query;
    const query = {};

    if (subject) query.subject = subject;
    if (grade) query.grade = grade;

    const notes = await Note.find(query);
    res.status(200).json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Error fetching notes', error: error.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, grade, chapter } = req.body;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user token' });
    }

    if (!title || !subject || !grade || !chapter) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const note = await Note.findOne({ _id: id, createdBy: teacherId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found or unauthorized' });
    }

    note.title = title;
    note.description = description || note.description;
    note.subject = subject;
    note.grade = grade;
    note.chapter = chapter;

    const updatedNote = await note.save();

    const activity = new RecentActivity({
      teacherId: teacherId,
      activityType: 'note_updated',
      description: `Updated note: "${title}" for ${subject} (Grade ${grade})`,
      resourceId: updatedNote._id,
    });

    await activity.save();

    res.status(200).json({ message: 'Note updated successfully', note: updatedNote });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Error updating note', error: error.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.userId;

    if (!teacherId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user token' });
    }

    const note = await Note.findOneAndDelete({ _id: id, createdBy: teacherId });
    if (!note) {
      return res.status(404).json({ message: 'Note not found or unauthorized' });
    }

    await RecentActivity.create({
      teacherId: teacherId,
      activityType: 'note_deleted',
      description: `Deleted note: "${note.title}" for ${note.subject} (Grade ${note.grade})`,
      resourceId: note._id,
    });

    res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
};
