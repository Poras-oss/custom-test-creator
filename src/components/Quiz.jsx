"use client"

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader2 } from 'lucide-react';
import StatisticsPage from './StatisticsPage';

export default function MCQQuiz({ questions, timePerQuestion, subject }) {
  const { user } = useUser();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(timePerQuestion);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [questionResults, setQuestionResults] = useState([]);
  const [shuffledOptions, setShuffledOptions] = useState([]);

  useEffect(() => {
    if (questions.length > 0 && !quizCompleted) {
      setStartTime(new Date());
      const timerInterval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(timerInterval);
            handleTimeUp();
            return timePerQuestion;
          }
          return prevTimer - 1;
        });
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [currentQuestionIndex, questions, quizCompleted, timePerQuestion]);

  const handleTimeUp = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    } else {
      submitQuiz();
    }
  };

  useEffect(() => {
    // Shuffle options only when the current question index changes
    const options = Object.entries(questions[currentQuestionIndex].options);
    const shuffled = options.sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
  }, [currentQuestionIndex, questions]);

  const selectOption = (optionKey) => {
    setSelectedOption(optionKey);
  };

  const nextQuestion = () => {
    updateQuestionResult();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setTimer(timePerQuestion);
    }
  };

  const updateQuestionResult = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption && currentQuestion.options[selectedOption] === currentQuestion.correct_answer;
    
    setQuestionResults(prevResults => [
      ...prevResults,
      {
        difficulty: currentQuestion.difficulty || null,
        timeTaken: timePerQuestion - timer,
        subtopic: currentQuestion.subtopic || null,
        isCorrect: isCorrect,
        question: currentQuestion,
        userAnswer: selectedOption ? currentQuestion.options[selectedOption] : null,
        timeUp: timer === 0
      }
    ]);
  };

  const submitQuiz = async () => {
    updateQuestionResult(); // Update result for the last question
    setQuizCompleted(true);

    const calculatedScore = questionResults.reduce((total, result) => result.isCorrect ? total + 1 : total, 0);
    setScore(calculatedScore);

    try {
      const response = await fetch('http://localhost:4000/custom-test/submit-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user?.id || 'anonymous',
          subject: `${subject} (MCQ)`,
          results: [{
            questions: questionResults.map(result => ({
              ...result,
              question: result.question,
              timeUp: result.timeUp,
              submittedAt: new Date()
            }))
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz results');
      }
      console.log(response);
            console.log('Quiz submitted successfully!');
    } catch (error) {
      console.log('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    }
  };

  if (questions.length === 0) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <h5 className="mt-4 text-2xl font-thin text-gray-700">Loading...</h5>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <StatisticsPage
        score={score}
        totalQuestions={questions.length}
        totalTime={questionResults.reduce((total, result) => total + result.timeTaken, 0)}
        results={questionResults}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">MCQ Quiz</h1>
          <span className="text-sm font-semibold text-gray-600">Time Remaining: {timer}s</span>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-white">{questions[currentQuestionIndex].question_text}</h2>
        </div>
        <div className="space-y-4 mb-8">
      {shuffledOptions.map(([key, value]) => (
        <div
          key={key}
          className={`p-3 rounded cursor-pointer transition-colors duration-300
            ${selectedOption === key
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          onClick={() => selectOption(key)}
        >
          {value}
        </div>
      ))}
    </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
            onClick={currentQuestionIndex === questions.length - 1 ? submitQuiz : nextQuestion}
          >
            {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}