import React, {useState, useEffect} from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function App() {
    const [quizId, setQuizId] = useState('');
    const [userId, setUserId] = useState('');
    const [answer, setAnswer] = useState(false);
    const [score, setScore] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        socket.on('joinedQuiz', (data) => {
            console.log(data);
        });

        socket.on('answerSubmitted', (data) => {
            console.log(data);
            setScore(data.score);
        });

        socket.on('leaderboardUpdate', (data) => {
            console.log(data);
            setLeaderboard(data);
        });

        socket.on('error', (data) => {
            console.log(data);
        });
    }, []);

    const handleJoinQuiz = () => {
        socket.emit('joinQuiz', {quizId, userId});
    };

    const handleSubmitAnswer = () => {
        socket.emit('submitAnswer', {quizId, userId, answer});
    };

    return (
        <div className="container">
            <h1>Real-time Quiz Challenge</h1>
            <div className="row">
                <label>QuizId</label>
                <input type="text" value={quizId} onChange={(e) => setQuizId(e.target.value)} placeholder="Quiz ID"/>
            </div>
            <div className="row">
                <label>UserId</label>
                <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID"/>
            </div>
            <div className="row">
                <button onClick={handleJoinQuiz}>Join Quiz</button>
            </div>
            <div className="row col">
            <div>Your question: 1 + 1 = 2</div>
                <div><input type="checkbox" checked={answer} onChange={(e) => setAnswer(e.target.checked)}/> True</div>
            </div>
            <div className="row">

                <button onClick={handleSubmitAnswer}>Submit Answer</button>
            </div>
            <p>Score: {score}</p>
            <h2>Leaderboard:</h2>
            <ul>
                {leaderboard.map((user, index) => (
                    <li key={index}>
                        quizId: {user?.quizId} - userId: {user?.userId} - score: {user?.score}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
