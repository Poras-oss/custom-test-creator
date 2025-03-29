import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams  } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import StatisticsPage from './components/StatisticsPage';
import PaymentPage from './components/PaymentPage';
import LeaderboardPage from './components/LeaderboardPage';
import  History  from './components/History';
import QuizApp from './components/QuizApp';
import PythonQuizApp from './components/PythonQuizApp'
import Quiz from './components/Quiz'
import Header from './components/Header';

interface Option {
  [key: string]: string;
}

interface McqQuestion {
  question_text: string;
  options: Option;
  correct_answer: string;
  difficulty?: string;
  subtopic?: string;
}

interface TableData {
  table_name: string;
  columns: string[];
  rows: any[][];
}

interface ExpectedOutput {
  columns: string[];
  rows: any[][];
  length: number;
}

interface SqlQuestion {
  question_text: string;
  expected_output: ExpectedOutput
  difficulty?: string;
  subtopic?: string;
  video?: string;
  scenario: string;
  'data-overview': string;
  company: string[];
  common_mistakes: string;
  ideal_time: string;
  interview_probability: string;
  roles: string;
  table_data?: TableData[];
}
interface TestCase {
  input: string;
  expected_output: string;
}

interface PythonQuestion {
  question_text: string;
  test_cases: TestCase[];
  boilerplate_code?: string;
  difficulty?: string;
  subtopic?: string;
  video?: string;
}

// Create context for dark mode
export const DarkModeContext = createContext({
  isDarkTheme: false,
  toggleTheme: () => {},
});

// Create a wrapper component for Header only
const HeaderOnly = () => {
  const { isDarkTheme, toggleTheme } = useContext(DarkModeContext);
  return <Header isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />;
};

const QuizWrapper: React.FC = () => {
  const [questions, setQuestions] = React.useState<SqlQuestion[]>([]);
  const [timer, setTimer] = React.useState<number>(0);
  const { isDarkTheme } = useContext(DarkModeContext);

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
      <HeaderOnly />
      <QuizApp questions={questions} timePerQuestion={timer} />
    </div>
  ) : (
    <div className="min-h-screen w-full">
      <HeaderOnly />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p>No questions found. Please start a new quiz from the home page.</p>
      </div>
    </div>
  );
};

const PythonQuizWrapper: React.FC = () => {
  const [questions, setQuestions] = React.useState<PythonQuestion[]>([]);
  const [timer, setTimer] = React.useState<number>(0);
  const { isDarkTheme } = useContext(DarkModeContext);

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
      <HeaderOnly />
      <PythonQuizApp questions={questions} timePerQuestion={timer} />
    </div>
  ) : (
    <div className="min-h-screen w-full">
      <HeaderOnly />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p>No questions found. Please start a new quiz from the home page.</p>
      </div>
    </div>
  );
};

const MCQQuizWrapper: React.FC = () => {
  const [questions, setQuestions] = React.useState<McqQuestion[]>([]);
  const [timer, setTimer] = React.useState<number>(0);
  const [subject, setSubject] = React.useState<string>('');
  const { isDarkTheme } = useContext(DarkModeContext);

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
      <HeaderOnly />
      <Quiz questions={questions} timePerQuestion={timer} subject={subject} />
    </div>
  ) : (
    <div className="min-h-screen w-full">
      <HeaderOnly />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p>No questions found. Please start a new quiz from the home page.</p>
      </div>
    </div>
  );
};

const StatisticsPageWrapper: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  
  // You might want to fetch the results and totalTime based on the testId
  // For now, we'll pass empty arrays and 0 as placeholders
  return <StatisticsPage testId={testId || ''} results={[]} totalTime={0} />;
};

const App: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Initialize dark mode from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDarkTheme = !isDarkTheme;
    setIsDarkTheme(newIsDarkTheme);
    localStorage.setItem('theme', newIsDarkTheme ? 'dark' : 'light');
  };

  return (
    <DarkModeContext.Provider value={{ isDarkTheme, toggleTheme }}>
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
                  <Route path="/statistics/:testId" element={<StatisticsPageWrapper/>} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/history" element={<History />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </DarkModeContext.Provider>
  );
};

export default App;
