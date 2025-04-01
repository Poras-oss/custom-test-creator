"use client"

import { useState, useEffect } from 'react';
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

interface Question {
  question_text: string;
  test_cases: TestCase[];
  boilerplate_code?: string;
  difficulty?: string;
  subtopic?: string;
  video?: string;
}

interface QuestionResult {
  difficulty: string;
  timeTaken: number;
  subtopic: string;
  isCorrect: boolean | null;
  question: Question;
  userAnswer: string | null;
  timeUp: boolean;
  questionIndex: number; // Add this line
}

interface TimeTracker {
  elapsed: number;
  remaining: number;
  isPaused: boolean;
}

interface Feedback {
  text: string;
  isCorrect: boolean;
  testResults?: TestResult[];
}

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

interface PythonQuizAppProps {
  questions: Question[];
  timePerQuestion: number;
}

export default function PythonQuizApp({ questions, timePerQuestion } : PythonQuizAppProps) {
  const { user } = useUser();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userCodes, setUserCodes] = useState<string[]>(() => 
    questions.map(q => q.boilerplate_code || '')
  );
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);

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
    Array(questions.length).fill(null).map((_, index) => ({
      difficulty: 'medium', // Default value
      timeTaken: 0,
      subtopic: 'general', // Default value
      isCorrect: null,
      question: questions[0], // Default to the first question
      userAnswer: null,
      timeUp: false,
      questionIndex: index // Add this line
    }))
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && !isTimeUp) {
      timer = setInterval(() => {
        setTimeTrackers(prevTrackers => {
          const newTrackers = [...prevTrackers];
          const currentTracker = newTrackers[currentQuestionIndex];
          if (currentTracker.remaining > 0) {
            currentTracker.remaining -= 1;
            currentTracker.elapsed += 1;
          } else {
            clearInterval(timer);
            setIsTimeUp(true);
            setIsTimerRunning(false);
          }
          return newTrackers;
        });

        setTimeRemaining(prev => {
          if (prev > 0) return prev - 1;
          setIsTimeUp(true);
          setIsTimerRunning(false);
          return 0;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, currentQuestionIndex, isTimeUp]);

  useEffect(() => {
    setTimeRemaining(timeTrackers[currentQuestionIndex].remaining);
  }, [timeTrackers, currentQuestionIndex]);


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

  const checkAllTestCases = async (userCode: string) => {
    const results: TestResult[] = [];
    for (const testCase of questions[currentQuestionIndex].test_cases) {
      try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
          language: 'python',
          version: '3.10',
          files: [{ 
            name: 'main.py',
            content: `${userCode}\n\n# Test case input\n${testCase.input}\n`
          }]
        });
        const output = response.data.run.output.trim();
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expected_output,
          actualOutput: output,
          passed: output === testCase.expected_output.trim()
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expected_output,
          actualOutput: 'Error executing code',
          passed: false
        });
      }
    }
    return results;
  };

  const handleRunCode = async () => {
    if (isTimeUp) {
      setFeedback({ text: 'Time is up! Cannot submit answer.', isCorrect: false });
      return;
    }

    setIsRunning(true);
    try {
      const testResults = await checkAllTestCases(userCodes[currentQuestionIndex]);
      const allTestsPassed = testResults.every(result => result.passed);
      
      updateQuestionResult(allTestsPassed, userCodes[currentQuestionIndex]);
      
      setFeedback({
        text: allTestsPassed ? '' : '',
        isCorrect: allTestsPassed,
        testResults: testResults
      });
      
      setOutput(testResults.map(result => 
        `Input: ${result.input}\nExpected: ${result.expectedOutput}\nActual: ${result.actualOutput}\nPassed: ${result.passed}`
      ).join('\n\n'));
    } catch (error) {
      setFeedback({ text: 'Error running code', isCorrect: false });
      setOutput('Error executing code');
    } finally {
      setIsRunning(false);
    }
  };
  const handleTestCode = async () => {
    if (isTimeUp) {
      setFeedback({ text: 'Time is up! Cannot submit answer.', isCorrect: false });
      return;
    }

    setIsSubmitting(true);
    try {
      const testResults = await checkAllTestCases(userCodes[currentQuestionIndex]);
      const allTestsPassed = testResults.every(result => result.passed);
      
      updateQuestionResult(allTestsPassed, userCodes[currentQuestionIndex]);
      
      setFeedback({
        text: allTestsPassed ? 'All test cases passed!' : 'Some test cases failed. Please try again.',
        isCorrect: allTestsPassed,
        testResults: testResults
      });
      
      setOutput(testResults.map(result => 
        `Input: ${result.input}\nExpected: ${result.expectedOutput}\nActual: ${result.actualOutput}\nPassed: ${result.passed}`
      ).join('\n\n'));
    } catch (error) {
      setFeedback({ text: 'Error running code', isCorrect: false });
      setOutput('Error executing code');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleQuestionSelect = (index: number) => {
    if (!questionResults[currentQuestionIndex].isCorrect && 
        !questionResults[currentQuestionIndex].timeUp) {
      updateQuestionResult(null);
    }

    setCurrentQuestionIndex(index);
    setTimeRemaining(timeTrackers[index].remaining);
    setFeedback(null);
    setOutput(null);
    setIsTimeUp(timeTrackers[index].remaining <= 0);
    setIsTimerRunning(timeTrackers[index].remaining > 0);
  };

  const updateQuestionResult = (isCorrect: boolean | null = null, userAnswer: string | null = null) => {
    const currentQuestion = questions[currentQuestionIndex];
    const timeTaken = timeTrackers[currentQuestionIndex].elapsed;

    setQuestionResults(prevResults => {
      const newResults = [...prevResults];
      newResults[currentQuestionIndex] = {
        difficulty: currentQuestion.difficulty || 'medium',
        timeTaken: timeTaken,
        subtopic: currentQuestion.subtopic || 'general',
        isCorrect: isCorrect,
        question: currentQuestion,
        userAnswer: userAnswer,
        timeUp: isTimeUp,
        questionIndex: currentQuestionIndex
      };
      return newResults;
    });

    if (isCorrect === true) {
      setIsTimerRunning(false);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsTimerRunning(false);
    setIsQuizSubmitting(true);
    questions.forEach((_question, index) => {
      if (!questionResults[index].isCorrect && !questionResults[index].timeUp) {
        updateQuestionResult(false);
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
          subject: 'Python (Coding)',
          results: [{
            questions: questionResults.map(result => ({
              ...result,
              question: questions[result.questionIndex],
              timeUp: result.timeUp || false,
              submittedAt: new Date().toISOString()
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

  return (
    <div className={`h-[calc(100vh-64px)] overflow-hidden ${isDarkMode ? 'bg-[#262626] text-white' : 'bg-white text-black'}`}>
      <nav className={`${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-200'} p-2 flex justify-between items-center border-b border-[#404040]`}>
        <h1 className="text-xl font-bold">Python Quiz</h1>
        <div className="flex items-center space-x-4">
          { currentQuestionIndex === questions.length - 1 && (
            <button
              className={`${isRunning ? 'bg-teal-500' : 'bg-teal-600'} text-white px-4 py-2 rounded hover:bg-teal-700 focus:outline-none flex items-center justify-center`}
              onClick={handleSubmitQuiz}
              disabled={isQuizSubmitting}
            > 
              {isQuizSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
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

      <div className={`flex gap-2 ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-gray-100'} px-4 py-2 overflow-x-auto whitespace-nowrap z-10`}>
        {questions.map((_question, index) => (
          <button
            key={index}
            className={`rounded-full min-w-[36px] h-9 flex items-center justify-center px-3 transition-colors ${
              index === currentQuestionIndex
                ? isDarkMode 
                  ? 'bg-teal-500 text-white' 
                  : 'bg-teal-600 text-white'
                : isDarkMode
                ? 'bg-[#2d2d2d] text-gray-300 hover:bg-[#3a3a3a]'
                : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
            } ${questionResults[index].isCorrect === true ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => handleQuestionSelect(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="flex h-[calc(100vh-64px-3rem-44px)]">
        <div className={`w-2/5 flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`p-4 overflow-y-auto h-full ${
          isDarkMode 
            ? '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2d2d2d] [&::-webkit-scrollbar-thumb]:bg-[#404040] [&::-webkit-scrollbar-thumb]:rounded-full'
            : '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full'
        }`}>
            <div className={`rounded-lg mb-4`}>
              <h2 className="text-xl font-bold mb-4">Question {currentQuestionIndex + 1}</h2>
              <div 
                className="question-text mb-6"
                dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
              />
              <h3 className="text-lg font-bold mb-2">Test Cases</h3>
              <ul className="space-y-2">
                {currentQuestion.test_cases && currentQuestion.test_cases.map((testCase, index) => (
                  <li key={index} className={`p-3 rounded ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="mb-1"><strong>Input:</strong></div>
                    <pre className={`text-sm p-2 rounded ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-gray-100'} overflow-x-auto max-w-full break-words whitespace-pre-wrap`}>{testCase.input}</pre>
                    <div className="mt-2 mb-1"><strong>Expected Output:</strong></div>
                    <pre className={`text-sm p-2 rounded ${isDarkMode ? 'bg-[#3a3a3a]' : 'bg-gray-100'} overflow-x-auto max-w-full break-words whitespace-pre-wrap`}>{testCase.expected_output}</pre>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={`w-3/5 flex flex-col ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
          <div className={`flex-none`}>
            <div className="px-4 py-2 font-medium">Code</div>
          </div>
          
          <Split
            className="flex flex-col h-[calc(100%-48px)]"
            direction="vertical"
            sizes={[60, 40]}
            minSize={100}
            gutterSize={8}
            gutterStyle={() => ({
              backgroundColor: isDarkMode ? '#989898' : '#e5e5e5',
              height: '8px',
              cursor: 'row-resize'
            })}
          >
            <div className="overflow-hidden">
              <MonacoEditor
                width="100%"
                height="100%"
                language="python"
                theme={isDarkMode ? "vs-dark" : "light"}
                value={userCodes[currentQuestionIndex]}
                onChange={(newValue) => {
                  setUserCodes(prevCodes => {
                    const newCodes = [...prevCodes];
                    newCodes[currentQuestionIndex] = newValue || '';
                    return newCodes;
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>

            <div className="flex flex-col h-full overflow-hidden">
              <div className={`flex-none p-3 gap-2 flex border-t border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                <button
                  className={`flex-1 h-9 rounded ${isRunning 
                    ? isDarkMode ? 'bg-teal-700' : 'bg-teal-500' 
                    : isDarkMode ? 'bg-teal-600 hover:bg-teal-500' : 'bg-teal-600 hover:bg-teal-500'
                  } text-white focus:outline-none flex items-center justify-center`}
                  onClick={handleRunCode}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running...
                    </>
                  ) : 'Run Code'}
                </button>
                <button
                  className={`flex-1 h-9 rounded ${isSubmitting 
                    ? isDarkMode ? 'bg-green-700' : 'bg-green-500' 
                    : isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-600 hover:bg-green-500'
                  } text-white focus:outline-none flex items-center justify-center`}
                  onClick={handleTestCode}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : 'Submit'}
                </button>
              </div>

              <div className={`flex-none px-4 py-1 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                <div className="font-medium">Output</div>
              </div>
              
              <div className={`flex-grow overflow-y-auto overflow-x-hidden ${
  isDarkMode 
    ? '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#2d2d2d] [&::-webkit-scrollbar-thumb]:bg-[#404040] [&::-webkit-scrollbar-thumb]:rounded-full'
    : '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full'
}`}>
                <div className={`p-4 ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
                  {feedback && feedback.text && (
                    <div className={`mb-4 p-3 rounded-md ${feedback.isCorrect 
                      ? isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800' 
                      : isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'
                    }`}>
                      {feedback.text}
                    </div>
                  )}
                  {feedback?.testResults && (
                    <div className="space-y-4">
                      {feedback.testResults.map((result, index) => (
                        <div key={index} className={`p-3 rounded-md ${
                          result.passed 
                            ? isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200' 
                            : isDarkMode ? 'bg-red-900/30 border border-red-700' : 'bg-red-50 border border-red-200'
                        }`}>
                          <div className="flex items-center mb-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                              result.passed 
                                ? isDarkMode ? 'bg-green-500' : 'bg-green-500' 
                                : isDarkMode ? 'bg-red-500' : 'bg-red-500'
                            }`}>
                              {result.passed ? '✓' : '✗'}
                            </div>
                            <h4 className="font-medium">Test Case {index + 1} - {result.passed ? 'Passed' : 'Failed'}</h4>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2 text-sm mt-2">
                            <div>
                              <div className="font-medium mb-1">Input:</div>
                              <pre className={`p-2 rounded ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-gray-100'} overflow-x-auto max-w-full break-words whitespace-pre-wrap`}>{result.input}</pre>
                            </div>
                            <div>
                              <div className="font-medium mb-1">Expected Output:</div>
                              <pre className={`p-2 rounded ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-gray-100'} overflow-x-auto max-w-full break-words whitespace-pre-wrap`}>{result.expectedOutput}</pre>
                            </div>
                            <div>
                              <div className="font-medium mb-1">Your Output:</div>
                              <pre className={`p-2 rounded ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-gray-100'} overflow-x-auto max-w-full break-words whitespace-pre-wrap`}>{result.actualOutput}</pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!feedback?.testResults && output && (
                    <pre className={`p-3 rounded ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-gray-100'} overflow-x-auto max-w-full break-words whitespace-pre-wrap`}>{output}</pre>
                  )}
                </div>
              </div>
            </div>
          </Split>
        </div>
      </div>

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