const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*'
    }
});
const mongoose = require('mongoose');
const redis = require('redis');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quizdb');

// Define question schema
const questionSchema = new mongoose.Schema({
    answer: Boolean
});

// Define quiz schema
const quizSchema = new mongoose.Schema({
    quizId: String,
    questions: [questionSchema]
});

// Define user schema
const userSchema = new mongoose.Schema({
    userId: String,
    quizId: String,
    score: Number
});

// Create quiz and user models
const Quiz = mongoose.model('Quiz', quizSchema);
const User = mongoose.model('User', userSchema);

let leaderBoard = [];

// Establish WebSocket connection
io.on('connection', (socket) => {
    console.log('Client connected');

    // Handle quiz join
    socket.on('joinQuiz', (data) => {
        const {quizId, userId} = data;
        // Find or create user document
        User.findOne({userId, quizId})
            .then(user => {
                if (!user) {
                    const user = new User({userId, quizId, score: 0});
                    user.save()
                        .then(_ => {
                            const existingInLeaderBoard = leaderBoard.some(u => u.userId === userId && u.quizId === quizId);
                            if (!existingInLeaderBoard) {
                                leaderBoard.push(user);
                            }
                            io.emit('leaderboardUpdate', leaderBoard);
                            socket.emit('joinedQuiz', {message: 'Joined quiz successfully'});
                        })
                        .catch(_ => socket.emit('error', 'Error joining quiz'));
                } else {
                    socket.emit('joinedQuiz', {message: 'Already joined quiz'});
                    io.emit('leaderboardUpdate', leaderBoard);
                }
            })
            .catch(_ => socket.emit('error', 'Error joining quiz'));
    });

    // Handle answer submission
    socket.on('submitAnswer', (data) => {
        const {quizId, userId, answer} = data;
        // Find user document
        User.findOne({userId, quizId})
            .then((user) => {
                if (!user) {
                    return socket.emit('error', 'User not found');
                }
                // Find quiz document
                Quiz.findOne({quizId})
                    .then((quiz) => {
                        if (!quiz) {
                            return socket.emit('error', 'Quiz not found');
                        }
                        const correctAnswer = quiz.questions[0].answer;
                        if (answer === correctAnswer) {
                            user.score += 1;
                            user.save()
                                .then(_ => {
                                    let existingUser = leaderBoard.find(u => u.userId === userId && u.quizId === quizId);
                                    existingUser.score = user.score;
                                    io.emit('leaderboardUpdate', leaderBoard);
                                    socket.emit('answerSubmitted', {message: 'Answer submitted successfully', score: user.score});
                                })
                                .catch(_ => socket.emit('error', 'Error updating score'));
                        } else {
                            socket.emit('answerSubmitted', {message: 'Incorrect answer', score: user.score});
                        }
                    })
                    .catch(_ => socket.emit('error', 'Error submit answer   '));
            })
            .catch(_ => socket.emit('error', 'Error submit answer'));
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(4000, () => {
    console.log('Server listening on port 4000');
});