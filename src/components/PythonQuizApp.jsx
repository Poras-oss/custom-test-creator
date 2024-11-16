"use client"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MonacoEditor from '@monaco-editor/react';
import { useUser } from '@clerk/clerk-react';
import Split from 'react-split';
import { Loader2, Video, X } from 'lucide-react';
import ReactPlayer from 'react-player';
import StatisticsPage from './StatisticsPage';

export default function PythonQuizApp({ questions, timePerQuestion }) {
  const { user, isLoaded } = useUser();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [isTimeUp, setIsTimeUp] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timePerQuestion * 60);
  const [timeTrackers, setTimeTrackers] = useState(() => 
    Array(questions.length).fill().map(() => ({
      elapsed: 0,
      remaining: timePerQuestion * 60,
      isPaused: true
    }))
  );
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [questionResults, setQuestionResults] = useState(() =>
    Array(questions.length).fill().map(() => ({
      difficulty: null,
      timeTaken: 0,
      subtopic: null,
      isCorrect: null,
      question: null,
      userAnswer: null,
      timeUp: false
    }))
  );

  useEffect(() => {
    let timer;
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
    setUserCode(questions[currentQuestionIndex].boilerplate_code || '');
  }, [currentQuestionIndex, timePerQuestion, questions]);

  const formatTime = (seconds) => {
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

  const checkAllTestCases = async (userCode) => {
    const results = [];
    for (const testCase of currentQuestion.test_cases) {
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
      const testResults = await checkAllTestCases(userCode);
      const allTestsPassed = testResults.every(result => result.passed);
      
      updateQuestionResult(allTestsPassed, userCode);
      
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
      setIsRunning(false);
    }
  };
  
  const handleQuestionSelect = (index) => {
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
    setFeedback('');
    setOutput(null);
    setIsTimeUp(timeTrackers[index].remaining <= 0);
    setIsTimerRunning(timeTrackers[index].remaining > 0);
    setUserCode(questions[index].boilerplate_code || '');
  };

  const updateQuestionResult = (isCorrect = null, userAnswer = null) => {
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

  const handleSubmitQuiz = async () => {
    setIsTimerRunning(false);
    
    questions.forEach((question, index) => {
      if (!questionResults[index].isCorrect && !questionResults[index].timeUp) {
        updateQuestionResult(null);
      }
    });

    try {
      const response = await fetch('http://localhost:4000/custom-test/submit-quiz', {
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#262626] text-white' : 'bg-white text-black'}`}>
      <nav className={`${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-200'} p-4 flex justify-between items-center`}>
        <h1 className="mb-4 text-xl font-bold">Python Quiz</h1>
        <div className="flex items-center space-x-4">
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
                {questions.map((question, index) => (
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
  
          {/* Question Details */}
          <div className={`${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-100'} p-4 flex-grow overflow-y-auto`}>
            <div className={`${isDarkMode ? 'bg-[#262626]' : 'bg-white'} rounded-lg p-4 mb-4 shadow-md`}>
              <h2 className="text-xl font-bold mb-4">Question {currentQuestionIndex + 1}</h2>
              <div 
                className="question-text mb-6"
                dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}
              />
              <h3 className="text-lg font-bold mb-2">Test Cases</h3>
              <ul className="space-y-2">
                {currentQuestion.test_cases && currentQuestion.test_cases.map((testCase, index) => (
                  <li key={index} className={`p-2 rounded ${isDarkMode ? 'bg-[#2f2c2c]' : 'bg-gray-200'}`}>
                    <strong>Input:</strong> <code className="text-sm">{testCase.input}</code> <br />
                    <strong>Expected Output:</strong> <code className="text-sm">{testCase.expected_output}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* Right side: Code Editor and Results */}
        <div className={`${isDarkMode ? 'bg-[#403f3f]' : 'bg-gray-200'} px-4 flex flex-col`}>
          <div className={`${isDarkMode ? 'bg-[#262626]' : 'bg-white'} rounded-t-lg p-2`}>
            <span className="font-semibold">Python</span>
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
              language="python"
              theme={isDarkMode ? "vs-dark" : "light"}
              value={userCode}
              onChange={setUserCode}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
              }}
            />
            <div className="flex flex-col">
              <div className="flex mt-2">
                <button
                  className={`flex-1 ${isRunning ? 'bg-teal-500' : 'bg-teal-600'} text-white px-4 py-2 rounded hover:bg-teal-700 focus:outline-none flex items-center justify-center`}
                  onClick={handleRunCode}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running...
                    </>
                  ) : currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Run Code'}
                </button>
              </div>
              <div className={`mt-4 ${isDarkMode ? 'bg-[#262626]' : 'bg-white'} rounded p-4 flex-grow overflow-y-auto`}>
                {feedback && (
                  <div className={`mb-4 p-2 rounded ${feedback.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {feedback.text}
                  </div>
                )}
 {output !== null && (
  <div className="mt-4 flex flex-col space-y-4">
    <h3 className="text-lg font-semibold">Test Results</h3>
    {feedback.testResults.map((result, index) => (
      <div key={index} className={`p-4 rounded-lg ${
        result.passed 
          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
      }`}>
        <h4 className="font-medium mb-2">Test Case {index + 1}</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Input:</span>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">{result.input}</pre>
          </div>
          <div>
            <span className="font-semibold">Expected Output:</span>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">{result.expectedOutput}</pre>
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Actual Output:</span>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">{result.actualOutput}</pre>
          </div>
        </div>
        <div className={`mt-2 font-medium ${
          result.passed 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {result.passed ? 'Passed' : 'Failed'}
        </div>
      </div>
    ))}
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