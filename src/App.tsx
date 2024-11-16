import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import StatisticsPage from './components/StatisticsPage';
import PaymentPage from './components/PaymentPage';
import LeaderboardPage from './components/LeaderboardPage';
import  History  from './components/History';
import QuizApp from './components/QuizApp';
import PythonQuizApp from './components/PythonQuizApp'
import Quiz from './components/Quiz'

const QuizWrapper: React.FC = () => {
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [timer, setTimer] = React.useState<number>(0);

  React.useEffect(() => {
    const storedQuestions = sessionStorage.getItem('quizQuestions');
    const timePerQuestion = sessionStorage.getItem('timePerQuestion');
    const time = parseInt(timePerQuestion || "0", 10);


    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
      setTimer(time);

      // Optional: Clear the storage after retrieving
      sessionStorage.removeItem('quizQuestions');
      sessionStorage.removeItem('timePerQuestion');
    }
  }, []);

  return questions.length > 0 ? (
    <div className="min-h-screen w-full">
      <QuizApp questions={questions} timePerQuestion={timer} />
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-screen">
      <p>No questions found. Please start a new quiz from the home page.</p>
    </div>
  );
};

const PythonQuizWrapper: React.FC = () => {
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [timer, setTimer] = React.useState<number>(0);

  React.useEffect(() => {
    const storedQuestions = sessionStorage.getItem('quizQuestions');
    const timePerQuestion = sessionStorage.getItem('timePerQuestion');
    const time = parseInt(timePerQuestion || "0", 10);


    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
      setTimer(time);

      // Optional: Clear the storage after retrieving
      sessionStorage.removeItem('quizQuestions');
      sessionStorage.removeItem('timePerQuestion');
    }
  }, []);

  return questions.length > 0 ? (
    <div className="min-h-screen w-full">
      <PythonQuizApp questions={questions} timePerQuestion={timer} />
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-screen">
      <p>No questions found. Please start a new quiz from the home page.</p>
    </div>
  );
};
const MCQQuizWrapper: React.FC = () => {
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [timer, setTimer] = React.useState<number>(0);
  const [subject, setSubject] = React.useState<string>('');

  React.useEffect(() => {
    const storedQuestions = sessionStorage.getItem('quizQuestions');
    const timePerQuestion = sessionStorage.getItem('timePerQuestion');
    const time = parseInt(timePerQuestion || "0", 10);
    const subject = sessionStorage.getItem('subject') || '';


    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
      setTimer(time);
      setSubject(subject);

      // Optional: Clear the storage after retrieving
      sessionStorage.removeItem('quizQuestions');
      sessionStorage.removeItem('timePerQuestion');
      sessionStorage.removeItem('subject');
    }
  }, []);

  return questions.length > 0 ? (
    <div className="min-h-screen w-full">
      <Quiz questions={questions} timePerQuestion={timer} subject={subject} />
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-screen">
      <p>No questions found. Please start a new quiz from the home page.</p>
    </div>
  );
};



const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Quiz route without Layout wrapper for fullscreen */}
        <Route path="/quiz" element={<QuizWrapper />} />
        <Route path="/python-coding-quiz" element={<PythonQuizWrapper/>} />
        <Route path="/mcq-quiz" element={<MCQQuizWrapper/>} />
        
        {/* Other routes with Layout wrapper */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/statistics/:testId" element={<StatisticsPage testId="1" />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
