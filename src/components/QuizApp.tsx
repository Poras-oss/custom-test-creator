'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MonacoEditor from '@monaco-editor/react';
import { useUser } from '@clerk/clerk-react';
import Split from 'react-split';
import { Loader2, Video, X } from 'lucide-react';
import ReactPlayer from 'react-player';
import StatisticsPage from './StatisticsPage';

interface TestCase {
  input: string;
  expected_output: string;
}

interface TableData {
  table_name: string;
  columns: string[];
  rows: any[][];
}

interface Question {
  question_text: string;
  expected_output: any[][];
  difficulty?: string;
  subtopic?: string;
  video?: string;
  table_data?: TableData[];
}

interface QuestionResult {
  difficulty: string | null;
  timeTaken: number;
  subtopic: string | null;
  isCorrect: boolean | null;
  question: Question | null;
  userAnswer: any | null;
  timeUp: boolean;
}

interface TimeTracker {
  elapsed: number;
  remaining: number;
  isPaused: boolean;
}

interface Feedback {
  text: string;
  isCorrect: boolean;
  expected?: any;
  userAnswer?: any;
}

interface QuizAppProps {
  questions: Question[];
  timePerQuestion: number;
}

type Output = 
  | string 
  | number 
  | Record<string, any>[] // Array of objects for table rows
  | null;

// Interface for Table Row
interface TableRow {
  [key: string]: any; // Each row can have dynamic key-value pairs
}

// Interface for Output Prop (TableOutput component)
interface TableOutputProps {
  output: TableRow[];   // Array of objects representing table rows
  isDarkMode: boolean;  // Dark mode toggle for styling
}

// Interface for Error Details
interface ErrorDetails {
  message: string;      // Error message
  details?: string;     // Optional detailed error information
  code?: string;        // Optional error code
  sql?: string;         // Optional SQL query associated with the error
}

// Interface for ErrorOutput Prop (ErrorOutput component)
interface ErrorOutputProps {
  error: ErrorDetails;  // Error details passed as a prop
}


export default function QuizApp({ questions, timePerQuestion }: QuizAppProps) {
  const { user, isLoaded } = useUser();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userQueries, setUserQueries] = useState<string[]>(questions.map(() => ''));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTimeUp, setIsTimeUp] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timePerQuestion * 60);
  const [timeTrackers, setTimeTrackers] = useState<TimeTracker[]>(() => 
    Array(questions.length).fill(null).map(() => ({
      elapsed: 0,
      remaining: timePerQuestion * 60,
      isPaused: true
    }))
  );
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>(() =>
    Array(questions.length).fill(null).map(() => ({
      difficulty: null,
      timeTaken: 0,
      subtopic: null,
      isCorrect: null,
      question: null,
      userAnswer: null,
      timeUp: false
    }))
  );
  const [activeTab, setActiveTab] = useState<'question' | 'tables'>('question');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && !isTimeUp) {
      timer = setInterval(() => {
        setTimeTrackers(prevTrackers => {
          const newTrackers = prevTrackers.map((tracker, index) => {
            if (index === currentQuestionIndex) {
              const newRemaining = tracker.remaining - 1;
              if (newRemaining <= 0) {
                clearInterval(timer);
                setIsTimeUp(true);
                setIsTimerRunning(false);
                return {
                  ...tracker,
                  remaining: 0,
                  elapsed: timePerQuestion * 60
                };
              }
              return {
                ...tracker,
                elapsed: tracker.elapsed + 1,
                remaining: newRemaining
              };
            }
            return tracker;
          });
          
          const currentTracker = newTrackers[currentQuestionIndex];
          setTimeRemaining(currentTracker.remaining);
          
          return newTrackers;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, currentQuestionIndex, isTimeUp, timePerQuestion]);

  useEffect(() => {
    setTimeRemaining(timeTrackers[currentQuestionIndex].remaining);
  }, [timeTrackers, currentQuestionIndex]);

  useEffect(() => {
    setTimeRemaining(timePerQuestion * 60);
    setIsTimerRunning(true);
  }, [currentQuestionIndex, timePerQuestion]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const openVideoPopup = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion.video) {
      setCurrentVideoUrl(currentQuestion.video);
      setIsVideoPopupOpen(true);
    } else {
      alert('No video available for this question');
    }
  };

  const closeVideoPopup = () => {
    setIsVideoPopupOpen(false);
    setCurrentVideoUrl('');
  };

  const handleRunCode = async () => {
    if (isTimeUp) {
      setFeedback({ text: 'Time is up! Cannot submit answer.', isCorrect: false });
      return;
    }

    setIsRunning(true);
    try {
      const response = await axios.get(`https://server.datasenseai.com/execute-sql/query?q=${encodeURIComponent(userQueries[currentQuestionIndex])}`);
      const userAnswer = response.data;


      const expectedOutput = questions[currentQuestionIndex].expected_output;
      const isCorrect = compareResults(userAnswer, expectedOutput);
      
      updateQuestionResult(isCorrect, userAnswer);
      
      setOutput(userAnswer);
    } catch (error) {
      // setFeedback({ text: 'Error running code', isCorrect: false });
      setOutput('Error executing query'+error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestCode = async () => {
    if (isTimeUp) {
      setFeedback({ text: 'Time is up! Cannot test answer.', isCorrect: false });
      return;
    }


    setIsTesting(true);
    try {
       const response = await axios.get(`https://server.datasenseai.com/execute-sql/query?q=${encodeURIComponent(userQueries[currentQuestionIndex])}`);
      const userAnswer = response.data;
      
      const expectedOutput = questions[currentQuestionIndex].expected_output;
      const isCorrect = compareResults(userAnswer, expectedOutput);

      if (isCorrect) {
        updateQuestionResult(isCorrect, userAnswer);
        setIsTimerRunning(false);
      }
      
      setFeedback({
        text: isCorrect ? 'Correct!' : 'Incorrect. Please try again.',
        isCorrect: isCorrect,
        expected: expectedOutput,
        userAnswer: userAnswer
      });
      
      setOutput(userAnswer);
    } catch (error) {
      setFeedback({ text: 'Error testing code', isCorrect: false });
      setOutput('Error executing query-> ');
      
    } finally {
      setIsTesting(false);
    }
  };
  
  const compareResults = (userResults: any[], expectedOutput: any[][]): boolean => {
    if (userResults.length !== expectedOutput.length) {
      return false;
    }
  
    const expectedString = JSON.stringify(expectedOutput.map(row => Object.values(row)));
    const userResultString = JSON.stringify(userResults.map(row => Object.values(row)));

    return userResultString === expectedString;
  };
  
  const handleQuestionSelect = (index: number) => {
    if (!questionResults[currentQuestionIndex].isCorrect && 
        !questionResults[currentQuestionIndex].timeUp) {
      updateQuestionResult(null);
    }

    setTimeTrackers(prevTrackers => 
      prevTrackers.map((tracker, i) => ({
        ...tracker,
        isPaused: i !== index
      }))
    );

    setCurrentQuestionIndex(index);
    setTimeRemaining(timeTrackers[index].remaining);
    setFeedback(null);
    setOutput(null);
    setIsTimeUp(timeTrackers[index].remaining <= 0);
    setIsTimerRunning(timeTrackers[index].remaining > 0);
  };

  const updateQuestionResult = (isCorrect: boolean | null = null, userAnswer: any = null) => {
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = timeTrackers[currentQuestionIndex].elapsed;

    setQuestionResults(prevResults => {
      const newResults = [...prevResults];
      newResults[currentQuestionIndex] = {
        difficulty: currentQuestion.difficulty || null,
        timeTaken: timeTaken,
        subtopic: currentQuestion.subtopic || null,
        isCorrect: isCorrect,
        question: currentQuestion,
        userAnswer: userAnswer,
        timeUp: isTimeUp
      };
      return newResults;
    });

    if (isCorrect === true) {
      setIsTimerRunning(false);
    }
  };

  const handleNextQuestion = () => {
    if (!questionResults[currentQuestionIndex].isCorrect && 
        !questionResults[currentQuestionIndex].timeUp) {
      updateQuestionResult(null);
    }

    setIsTimerRunning(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setFeedback(null);
      setOutput(null);
      setIsTimeUp(false);
      setIsTimerRunning(true);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    setIsTimerRunning(false);
    setIsSubmitting(true);
    
    questions.forEach((_question, index) => {
      if (!questionResults[index].isCorrect && !questionResults[index].timeUp) {
        updateQuestionResult(null);
      }
    });

    try {
      const response = await fetch('https://server.datasenseai.com/custom-test/submit-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user?.id || 'anonymous',
          subject: 'SQL (Coding)',
          results: [{
            questions: questionResults.map((result, index) => ({
              ...result,
              question: questions[index],
              timeUp: result.timeUp || false,
              submittedAt: new Date()
            }))
          }]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Quiz submitted successfully!', data);
        setQuizSubmitted(true);
      } else {
        throw new Error(`Failed to submit quiz: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  if (!questions || questions.length === 0) return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      <h5 className="mt-4 text-2xl font-thin text-gray-700">Loading...</h5>
    </div>
  );

  if (quizSubmitted) {
  
    return (
      <StatisticsPage
        testId={user?.id || 'anonymous'}
        results={questionResults}
        totalTime={timePerQuestion}
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];


  const TableOutput = ({ output, isDarkMode }: TableOutputProps) => (
    <table className="w-full border-collapse">
      <thead>
        <tr className={isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-200'}>
          {Object.keys(output[0]).map((header, index) => (
            <th key={index} className="border px-4 py-2">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {output.map((row, rowIndex) => (
          <tr key={rowIndex} className={isDarkMode ? 'bg-[#262626]' : 'bg-gray-50'}>
            {Object.values(row).map((cell, cellIndex) => (
              <td key={cellIndex} className="border px-4 py-2 whitespace-nowrap">
                {cell !== null && cell !== undefined
                  ? typeof cell === 'object'
                    ? JSON.stringify(cell)
                    : String(cell)
                  : ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  
  // Helper component to render error output
  const ErrorOutput = ({ error }: ErrorOutputProps) => (
    <div className="text-red-600 bg-white-50 border border-grey-400 rounded-md p-4">
      <p className="font-bold">Error:</p>
      <p>
        <strong>Message:</strong> {error.message}
      </p>
      <p>
        <strong>Details:</strong> {error.details}
      </p>
      <p>
        <strong>Error Code:</strong> {error.code}
      </p>
    
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#262626] text-white' : 'bg-white text-black'}`}>
      <nav className={`${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-200'} p-4 flex justify-between items-center`}>
        <h1 className="mb-4 text-xl font-bold">SQL Quiz</h1>
        <div className="flex items-center space-x-4">
          {(currentQuestionIndex === questions.length - 1 &&  <button 
                  onClick={handleNextQuestion}
                  className="px-3 py-1 rounded text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </button>)}
       
          <div className="text-lg font-semibold">
            Time remaining: {formatTime(timeRemaining)}
          </div>
          <button
            onClick={openVideoPopup}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-[#262626] text-white' : 'bg-white text-[#262626]'}`}
          >
            <Video size={24} />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-white text-black' : 'bg-[#262626] text-white'}`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>
      <Split
        className="flex h-[calc(100vh-4rem)]"
        sizes={[50, 50]}
        minSize={300}
        expandToMin={false}
        gutterSize={10}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="horizontal"
        cursor="col-resize"
      >
        {/* Left side: Question List and Details */}
        <div className="flex flex-col overflow-hidden">
          {/* Question List */}
          <div className={`flex gap-10 ${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-200'} px-4 h-1/8 relative`}>
            <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 hover:scrollbar-thumb-gray-500">
              <ul className="flex flex-nowrap gap-4 py-2">
                {questions.map((_question, index) => (
                  <li
                    key={index}
                    className={`cursor-pointer py-2 px-4 rounded border ${
                      index === currentQuestionIndex
                        ? 'bg-teal-500 text-white'
                        : isDarkMode
                        ? 'bg-[#262626] text-white hover:bg-gray-600'
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    }`}
                    onClick={() => handleQuestionSelect(index)}
                  >
                    {index + 1}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex ${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-200'} px-4`}>
            {['Question', 'Tables'].map((tab) => (
              <button
                key={tab}
                className={`py-2 px-4 ${activeTab === tab.toLowerCase() ? 'border-b-2 border-teal-500' : ''}`}
                onClick={() => setActiveTab(tab.toLowerCase() as 'question' | 'tables')}
              >
                {tab}
              </button>
            ))}
          </div>
  
          {/* Question Details */}
          <div className={`${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-100'} p-4 flex-grow overflow-y-auto`}>
            {activeTab === 'question' && (
              <div className={`${isDarkMode ? 'bg-[#262626]' : 'bg-white'} rounded-lg p-4 mb-4 shadow-md`}>
                <div 
                  className="question-text"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
                />
              </div>
            )}

            {activeTab === 'tables' && (
              <div className={`${isDarkMode ? 'bg-[#262626]' : 'bg-white'} rounded-lg p-4 mb-4 shadow-md`}>
                <h3 className="text-lg font-bold mb-2">Tables</h3>
                {currentQuestion.table_data && currentQuestion.table_data.map((table, tableIndex) => (
                  <div key={tableIndex} className="mb-4">
                    <h4 className="text-md font-semibold mb-2">{table.table_name}</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            {table.columns.map((column, columnIndex) => (
                              <th key={columnIndex} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className={isDarkMode ? 'bg-gray-800' : 'bg-white divide-y divide-gray-200'}>
                          {table.rows.slice(0,10).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                                  {cell !== null && cell !== undefined
                                    ? typeof cell === 'object'
                                      ? JSON.stringify(cell)
                                      : String(cell)
                                    : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  
                    </div>
                  </div>
                ))}
                   {currentQuestion.expected_output && (
  <div>
    <h3 className="text-lg font-bold mb-2">Expected Answer</h3>
    <table className="min-w-full divide-y divide-gray-200">
      <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
        <tr>
        {currentQuestion.expected_output?.[0]?.map((column, columnIndex) => (
            <th
              key={columnIndex}
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={isDarkMode ? 'bg-gray-800' : 'bg-white divide-y divide-gray-200'}>
        {currentQuestion.expected_output.slice(0, 10).map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((value, cellIndex) => (
              <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm">
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
              </div>
              
            )}
          </div>
        </div>
        {/* Right side: Code Editor and Results */}
        <div className={`${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-200'} px-4 flex flex-col`}>
          <div className={`${isDarkMode ? 'bg-[#262626]' : 'bg-white'} rounded-t-lg p-2`}>
            <span className="font-semibold">SQL</span>
          </div>
          <Split
            className="flex-grow h-full"
            direction="vertical"
            sizes={[70, 30]}
            minSize={100}
            gutterSize={10}
            gutterAlign="center">
  
            <MonacoEditor
              width="100%"
              height="100%"
              language="sql"
              theme={isDarkMode ? "vs-dark" : "light"}
              value={userQueries[currentQuestionIndex]}
              onChange={(value) => {
                const newQueries = [...userQueries];
                newQueries[currentQuestionIndex] = value || '';
                setUserQueries(newQueries);
              }}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
              }}
            />
            <div className="flex flex-col">
              <div className="flex mt-2 space-x-2">
                <button
                  className={`flex-1 ${isRunning ? 'bg-teal-500' : 'bg-teal-600'} text-white px-4 py-2 rounded hover:bg-teal-700 focus:outline-none flex items-center justify-center`}
                  onClick={handleRunCode}
                  disabled={isRunning || isTesting}
                >
                  {isRunning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running...
                    </>
                  ) : 'Run Code'}
                </button>
                <button
                  className={`flex-1 ${isTesting ? 'bg-blue-500' : 'bg-blue-600'} text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none flex items-center justify-center`}
                  onClick={handleTestCode}
                  disabled={isRunning || isTesting}
                >
                  {isTesting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Testing...
                    </>
                  ) : 'Submit Code'}
                </button>
             
              </div>
              <div className={`mt-4 ${isDarkMode ? 'bg-[#262626]' : 'bg-white'} rounded p-4 flex-grow overflow-y-auto`}>
                {feedback && (
                  <div className={`mb-4 p-2 rounded ${feedback.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {feedback.text}
                  </div>
                )}
                {output !== null && (
  <div className="mt-2 flex flex-col space-y-4">
    <div className="font-semibold">OUTPUT</div>
    <div className="overflow-x-auto">
      {Array.isArray(output) && output.length > 0 ? (
        <TableOutput output={output} isDarkMode={isDarkMode} />
      ) : typeof output === 'object' && output.error ? (
        <ErrorOutput error={output} />
      ) : (
        <p>{output}</p>
      )}
    </div>
  </div>
)}
              </div>
            </div>
          </Split>
        </div>
      </Split>

      {/* Video Popup */}
      {isVideoPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg relative w-11/12 max-w-4xl">
            <button
              onClick={closeVideoPopup}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="aspect-w-16 aspect-h-9">
              <ReactPlayer
                url={currentVideoUrl}
                width="100%"
                height="100%"
                controls
                playing
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}