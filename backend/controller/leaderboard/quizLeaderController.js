const QuizScore = require('../../model/quizScoreModel');
const StudentProgress = require('../../model/studentQuizProgressModel');
const StudentModel = require('../../model/signupUserModel');

exports.getLeaderboard = async (req, res) => {
    try {
        const { subject, level, timeRange } = req.query;
        
        const timeFilter = getTimeFilter(timeRange);
        
        const students = await StudentModel.find({ role: 'student' }).select('name email _id');
        
        const scoreQuery = {};
        if (subject) scoreQuery.subject = new RegExp(`^${subject}$`, 'i');
        if (level) scoreQuery.level = parseInt(level);
        if (timeFilter) scoreQuery.createdAt = timeFilter;
        
        const allScores = await QuizScore.find(scoreQuery)
            .populate('studentId', 'name email')
            .lean();
        
        const leaderboard = {
            overall: await getOverallLeaderboard(allScores, students),
            bySubject: subject ? null : await getSubjectLeaderboard(allScores),
            byLevel: level ? null : await getLevelLeaderboard(allScores),
            byLevelsUnlocked: await getLevelsUnlockedLeaderboard(students),
            recentAchievements: await getRecentAchievements(),
            streaks: await getLongestStreaks(),
            trends: await getProgressTrends(allScores, students)
        };
        
        res.status(200).json({
            success: true,
            data: leaderboard
        });
        
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaderboard',
            error: error.message
        });
    }
};

function getTimeFilter(timeRange) {
    const now = new Date();
    switch(timeRange) {
        case 'weekly':
            return { $gte: new Date(now.setDate(now.getDate() - 7)) };
        case 'monthly':
            return { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        case 'yearly':
            return { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        default:
            return null;
    }
}

async function getOverallLeaderboard(scores, students) {
    const studentMap = new Map();
    
    students.forEach(student => {
        studentMap.set(student._id.toString(), {
            id: student._id,
            name: student.name,
            email: student.email,
            totalScore: 0,
            totalQuizzes: 0,
            subjects: new Set(),
            levels: new Set()
        });
    });
    
    scores.forEach(score => {
        const studentData = studentMap.get(score.studentId._id.toString());
        if (studentData) {
            studentData.totalScore += score.percentage;
            studentData.totalQuizzes += 1;
            studentData.subjects.add(score.subject.toLowerCase());
            studentData.levels.add(score.level);
        }
    });
    
    return Array.from(studentMap.values())
        .map(student => ({
            ...student,
            averageScore: student.totalQuizzes > 0 ? (student.totalScore / student.totalQuizzes).toFixed(2) : 0,
            subjects: Array.from(student.subjects),
            levelsCompleted: student.levels.size
        }))
        .filter(student => student.totalQuizzes > 0)
        .sort((a, b) => b.averageScore - a.averageScore || b.levelsCompleted - a.levelsCompleted)
        .slice(0, 50);
}

async function getSubjectLeaderboard(scores) {
    const subjectMap = new Map();
    
    scores.forEach(score => {
        const subject = score.subject.toLowerCase();
        if (!subjectMap.has(subject)) {
            subjectMap.set(subject, new Map());
        }
        
        const studentMap = subjectMap.get(subject);
        const studentId = score.studentId._id.toString();
        
        if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
                studentId: score.studentId._id,
                name: score.studentId.name,
                highestScore: score.percentage,
                levels: new Set([score.level]),
                totalQuizzes: 1
            });
        } else {
            const studentData = studentMap.get(studentId);
            studentData.highestScore = Math.max(studentData.highestScore, score.percentage);
            studentData.levels.add(score.level);
            studentData.totalQuizzes += 1;
        }
    });
    
    const result = {};
    subjectMap.forEach((students, subject) => {
        result[subject] = Array.from(students.values())
            .map(student => ({
                ...student,
                levelsCompleted: student.levels.size
            }))
            .sort((a, b) => b.highestScore - a.highestScore || b.levelsCompleted - a.levelsCompleted)
            .slice(0, 20);
    });
    
    return result;
}

async function getLevelLeaderboard(scores) {
    const levelMap = new Map();
    
    scores.forEach(score => {
        const levelKey = `${score.subject.toLowerCase()}-${score.level}`;
        if (!levelMap.has(levelKey)) {
            levelMap.set(levelKey, []);
        }
        
        levelMap.get(levelKey).push({
            studentId: score.studentId._id,
            name: score.studentId.name,
            score: score.score,
            totalQuestions: score.totalQuestions,
            percentage: score.percentage,
            date: score.createdAt
        });
    });
    
    const result = {};
    levelMap.forEach((scores, levelKey) => {
        const [subject, level] = levelKey.split('-');
        if (!result[subject]) result[subject] = {};
        
        result[subject][level] = scores
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 10);
    });
    
    return result;
}

async function getLevelsUnlockedLeaderboard(students) {
    const progress = await StudentProgress.find()
        .populate('studentId', 'name email')
        .lean();
    
    const studentMap = new Map();
    students.forEach(student => {
        studentMap.set(student._id.toString(), {
            id: student._id,
            name: student.name,
            email: student.email,
            totalLevelsUnlocked: 0,
            subjects: {}
        });
    });
    
    progress.forEach(p => {
        const studentData = studentMap.get(p.studentId._id.toString());
        if (studentData) {
            Object.entries(p.subjectProgress).forEach(([subject, levels]) => {
                const subjectLower = subject.toLowerCase();
                if (!studentData.subjects[subjectLower]) {
                    studentData.subjects[subjectLower] = levels.length;
                }
                studentData.totalLevelsUnlocked += levels.length;
            });
        }
    });
    
    const overall = Array.from(studentMap.values())
        .filter(student => student.totalLevelsUnlocked > 0)
        .map(student => ({
            id: student.id,
            name: student.name,
            email: student.email,
            totalLevelsUnlocked: student.totalLevelsUnlocked,
            subjects: Object.keys(student.subjects).map(subject => ({
                subject,
                levelsUnlocked: student.subjects[subject]
            }))
        }))
        .sort((a, b) => b.totalLevelsUnlocked - a.totalLevelsUnlocked)
        .slice(0, 20);
    
    const bySubject = {};
    studentMap.forEach(student => {
        Object.entries(student.subjects).forEach(([subject, levels]) => {
            if (!bySubject[subject]) bySubject[subject] = [];
            bySubject[subject].push({
                id: student.id,
                name: student.name,
                email: student.email,
                levelsUnlocked: levels
            });
        });
    });
    
    Object.keys(bySubject).forEach(subject => {
        bySubject[subject] = bySubject[subject]
            .sort((a, b) => b.levelsUnlocked - a.levelsUnlocked)
            .slice(0, 20);
    });
    
    return { overall, bySubject };
}

async function getRecentAchievements() {
    const recentScores = await QuizScore.find({
        percentage: { $gte: 90 }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('studentId', 'name')
    .lean();
    
    const recentCompletions = await StudentProgress.find({
        $where: 'Object.keys(this.subjectProgress).length > 0'
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .populate('studentId', 'name')
    .lean();
    
    return {
        highScores: recentScores.map(score => ({
            student: score.studentId.name,
            subject: score.subject.toLowerCase(),
            level: score.level,
            percentage: score.percentage,
            date: score.createdAt
        })),
        levelCompletions: recentCompletions.map(progress => ({
            student: progress.studentId.name,
            subjects: Object.keys(progress.subjectProgress).map(s => s.toLowerCase()),
            levelsCompleted: Object.values(progress.subjectProgress).flat().length,
            date: progress.updatedAt
        }))
    };
}

async function getLongestStreaks() {
    const allProgress = await StudentProgress.find()
        .populate('studentId', 'name')
        .lean();
    
    return allProgress
        .map(progress => {
            const streaks = [];
            const subjectProgress = progress.subjectProgress instanceof Map 
                ? progress.subjectProgress 
                : new Map(Object.entries(progress.subjectProgress || {}));
            
            subjectProgress.forEach((levels, subject) => {
                if (!Array.isArray(levels) || levels.length === 0) {
                    console.warn(`Invalid levels data for subject ${subject}:`, levels);
                    return;
                }
                
                const sortedLevels = [...new Set(levels)].sort((a, b) => a - b);
                let currentStreak = 1;
                let maxStreak = 1;
                
                for (let i = 1; i < sortedLevels.length; i++) {
                    if (sortedLevels[i] === sortedLevels[i - 1] + 1) {
                        currentStreak++;
                        maxStreak = Math.max(maxStreak, currentStreak);
                    } else {
                        currentStreak = 1;
                    }
                }
                
                if (maxStreak > 1) {
                    streaks.push({
                        subject: subject.toLowerCase(),
                        streak: maxStreak,
                        levels: sortedLevels.slice(0, maxStreak)
                    });
                }
            });
            
            return {
                student: progress.studentId.name,
                streaks: streaks.sort((a, b) => b.streak - a.streak).slice(0, 3)
            };
        })
        .filter(student => student.streaks.length > 0)
        .sort((a, b) => Math.max(...b.streaks.map(s => s.streak)) - Math.max(...a.streaks.map(s => s.streak)))
        .slice(0, 5);
}

async function getProgressTrends(scores, students) {
    const studentMap = new Map();
    
    students.forEach(student => {
        studentMap.set(student._id.toString(), {
            id: student._id,
            name: student.name,
            email: student.email,
            scores: []
        });
    });
    
    scores.forEach(score => {
        const studentData = studentMap.get(score.studentId._id.toString());
        if (studentData) {
            studentData.scores.push({
                percentage: score.percentage,
                date: score.createdAt
            });
        }
    });
    
    return Array.from(studentMap.values())
        .filter(student => student.scores.length >= 2)
        .map(student => {
            const sortedScores = student.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
            const latestScore = sortedScores[0].percentage;
            const previousScore = sortedScores[1].percentage;
            const improvement = (latestScore - previousScore).toFixed(2);
            
            return {
                name: student.name,
                email: student.email,
                latestScore,
                previousScore,
                improvement: improvement > 0 ? improvement : 0
            };
        })
        .sort((a, b) => b.improvement - a.improvement)
        .slice(0, 10);
}