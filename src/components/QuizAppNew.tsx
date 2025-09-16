import React, { useState, useEffect, useRef, useContext  } from 'react';
import axios from 'axios';
import MonacoEditor from '@monaco-editor/react';
import { useUser, UserButton } from '@clerk/clerk-react';
import Split from 'react-split';
import { 
    Loader2, CheckCircle2, XCircle, Send, Play, Sun, Moon, Gauge, NotebookText, 
    Timer, Building2, Calendar, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
    LayoutDashboard, FileText, Table2, ThumbsUp, ThumbsDown, Share2, Link
} from 'lucide-react';
import StatisticsPage from './StatisticsPage';
import logo from "../assets/coderpadLogo.png"; // Make sure this path is correct
import { DarkModeContext } from '../App';

// SECTION: TypeScript Interfaces
interface Question {
  _id: string;
  title: string;
  question_text: string;
  expected_output: any;
  difficulty?: string;
  subtopics?: string[];
  video?: string;
  scenario: string;
  'data-overview': string;
  table_data?: any[];
  company?: string[];
  year?: string;
  ideal_time?: string;
}

interface QuizAppProps {
  questions: Question[];
  timePerQuestion: number;
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
}

interface Feedback {
  text: string;
  isCorrect: boolean;
}

// SECTION: Reusable Table View Component
const TableView: React.FC<{ title: string; columns: string[]; rows: any[][]; isDarkMode: boolean }> = ({ title, columns, rows }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">{title}</h3>
        <div className="overflow-auto border border-gray-200 dark:border-[#333333] rounded-md">
            <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-[#252526]">
                    <tr>
                        {columns.map((col) => (
                            <th key={col} className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-[#333333]'>
                    {rows.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-[#262626]' : 'bg-gray-50 dark:bg-[#2c2c2c]'}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 whitespace-nowrap">{String(cell)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


function parseDataOverview(inputString: string): Map<string, string> {
    const resultMap = new Map<string, string>();
    if (!inputString) return resultMap;
    const lines = inputString.split("\n");
    lines.forEach(line => {
        const colonIndex = line.indexOf(":");
        if (colonIndex !== -1) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            resultMap.set(key, value);
        }
    });
    return resultMap;
}

const TableOutput: React.FC<{ output: Record<string, any>[] }> = ({ output }) => (
  <div className="overflow-auto border border-gray-200 dark:border-[#333333] rounded-md">
    <table className="w-full text-sm">
      <thead className="bg-gray-100 dark:bg-[#252526]">
        <tr>
          {Object.keys(output[0]).map((header) => (
            <th key={header} className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody className='divide-y divide-gray-200 dark:divide-[#333333]'>
        {output.map((row, rowIndex) => (
          <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-[#262626]' : 'bg-gray-50 dark:bg-[#2c2c2c]'}>
            {Object.values(row).map((cell, cellIndex) => (
              <td key={cellIndex} className="px-4 py-2 whitespace-nowrap">{String(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ErrorOutput: React.FC<{ error: { message: string } }> = ({ error }) => (
  <div className="p-4 text-red-500 font-mono text-sm bg-red-50 dark:bg-red-900/10 rounded-md">
    {error.message}
  </div>
);

export default function QuizApp({ questions, timePerQuestion }: QuizAppProps) {
  const { user } = useUser();
  const { isDarkTheme: isDarkMode, toggleTheme } = useContext(DarkModeContext);
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [isFolded, setIsFolded] = useState(false);
  const [activeTab, setActiveTab] = useState('question');
  const [activeNestedTab, setActiveNestedTab] = useState('expected_output');
  const [verticalFoldState, setVerticalFoldState] = useState<'none' | 'editor_folded' | 'console_folded'>('none');
  
  const [questionFeedback, setQuestionFeedback] = useState<'like' | 'dislike' | null>(null);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const sharePopupRef = useRef<HTMLDivElement>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userQueries, setUserQueries] = useState<string[]>(() => questions.map(() => ''));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [output, setOutput] = useState<any | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [timeTrackers, setTimeTrackers] = useState<TimeTracker[]>(() =>
    Array(questions.length).fill(null).map(() => ({
      elapsed: 0,
      remaining: timePerQuestion * 60,
    }))
  );
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>(() =>
    questions.map((q) => ({
      difficulty: q.difficulty || null,
      timeTaken: 0,
      subtopic: q.subtopics ? q.subtopics[0] : null,
      isCorrect: null,
      question: q,
      userAnswer: null,
      timeUp: false,
    }))
  );

  useEffect(() => {
    const updateCount = () => setOnlineCount(Math.floor(Math.random() * (299 - 101 + 1)) + 101);
    updateCount();
    const intervalId = setInterval(updateCount, 900000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (sharePopupRef.current && !sharePopupRef.current.contains(event.target as Node)) {
            setIsSharePopupOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sharePopupRef]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setTimeTrackers(prevTrackers => {
          const newTrackers = [...prevTrackers];
          const currentTracker = newTrackers[currentQuestionIndex];
          const newRemaining = currentTracker.remaining - 1;

          if (newRemaining <= 0) {
            clearInterval(timer);
            setIsTimerRunning(false);
            setQuestionResults(prevResults => {
              const newResults = [...prevResults];
              newResults[currentQuestionIndex].timeUp = true;
              newResults[currentQuestionIndex].isCorrect = false;
              return newResults;
            });
          }
          
          newTrackers[currentQuestionIndex] = {
            remaining: Math.max(0, newRemaining),
            elapsed: currentTracker.elapsed + 1,
          };

          return newTrackers;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, currentQuestionIndex]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyStyle = (difficulty?: string) => {
    if (!difficulty) return isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800';
    const normalized = difficulty.toLowerCase();
    if (normalized === 'advance' || normalized === 'advanced') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (normalized === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (normalized === 'easy') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };
  
  const handleShareClick = (platform: 'copy' | 'facebook' | 'linkedin') => {
    const url = window.location.href;
    const title = questions[currentQuestionIndex]?.title || "Check out this SQL question!";
    let shareUrl = '';

    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
            break;
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                alert("Link copied to clipboard!");
            }).catch(err => {
                alert("Failed to copy link.");
                console.error('Could not copy text: ', err);
            });
            break;
    }
    setIsSharePopupOpen(false); 
  };


  const compareResults = (userResults: any, expectedOutput: any): boolean => {
    if (!Array.isArray(userResults) || userResults.length !== expectedOutput.rows.length) return false;
    if (userResults.length === 0 && expectedOutput.rows.length === 0) return true;

    const normalizeRow = (row: any) => JSON.stringify(Object.values(row).sort());
    const userRowsSorted = userResults.map(normalizeRow).sort();
    
    const expectedRowsAsObjects = expectedOutput.rows.map((rowArray: any[]) => {
      const rowObj: { [key: string]: any } = {};
      expectedOutput.columns.forEach((col: string, i: number) => { rowObj[col] = rowArray[i] });
      return rowObj;
    });

    const expectedRowsSorted = expectedRowsAsObjects.map(normalizeRow).sort();
    return JSON.stringify(userRowsSorted) === JSON.stringify(expectedRowsSorted);
  };

  const handleRunCode = async () => {
    if (timeTrackers[currentQuestionIndex].remaining <= 0) return;
    setIsRunning(true);
    setFeedback(null);
    setOutput(null);
    try {
      const response = await axios.get(`https://server.datasenseai.com/execute-sql/query?q=${encodeURIComponent(userQueries[currentQuestionIndex])}`);
      setOutput(response.data);
    } catch (error: any) {
      setOutput({ error: true, message: error.response?.data?.error || 'Error executing query.' });
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleTestCode = async () => {
    if (timeTrackers[currentQuestionIndex].remaining <= 0) return;
    setIsSubmitting(true);
    const currentQuestion = questions[currentQuestionIndex];

    try {
      const response = await axios.get(`https://server.datasenseai.com/execute-sql/query?q=${encodeURIComponent(userQueries[currentQuestionIndex])}`);
      const userAnswer = response.data;
      setOutput(userAnswer);
      const isCorrect = compareResults(userAnswer, currentQuestion.expected_output);

      setFeedback({ text: isCorrect ? 'Correct!' : 'Incorrect.', isCorrect: isCorrect });
      
      setQuestionResults(prev => {
          const newResults = [...prev];
          newResults[currentQuestionIndex] = {
              ...newResults[currentQuestionIndex],
              isCorrect: isCorrect,
              userAnswer: userAnswer,
              timeTaken: timeTrackers[currentQuestionIndex].elapsed,
          };
          return newResults;
      });

      if(isCorrect) {
        setIsTimerRunning(false);
      }

    } catch (error: any) {
      setOutput({ error: true, message: error.response?.data?.error || 'Your code could not be executed.' });
      setFeedback({ text: 'Error during submission.', isCorrect: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuizNavigation = (offset: number) => {
      const newIndex = currentQuestionIndex + offset;
      if (newIndex >= 0 && newIndex < questions.length) {
          handleQuestionSelect(newIndex);
      }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
    setFeedback(null);
    setOutput(null);
    setIsTimerRunning(timeTrackers[index].remaining > 0 && !questionResults[index].isCorrect);
    setActiveTab('question');
    setActiveNestedTab('expected_output');
  };

  const handleSubmitQuiz = async () => {
    setIsTimerRunning(false);
    setIsSubmitting(true);
    
    try {
      console.log("Submitting quiz with results:", questionResults);
      setQuizSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      <h5 className="mt-4 text-2xl font-thin text-gray-700">Loading Quiz...</h5>
    </div>
  );

  if (quizSubmitted) {
    return (
      <StatisticsPage
        testId={user?.id || 'anonymous'}
        results={questionResults}
        totalTime={timePerQuestion * questions.length}
      />
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const timeRemaining = timeTrackers[currentQuestionIndex].remaining;
  const currentResult = questionResults[currentQuestionIndex];

  const gutter = (_index: number, direction: 'horizontal' | 'vertical') => {
    const gutterElement = document.createElement('div');
    gutterElement.className = `
      ${direction === 'horizontal' ? 'w-1 h-full' : 'w-full h-1'} 
      bg-gray-200 dark:bg-[#585858] 
      hover:bg-teal-500 dark:hover:bg-teal-400 
      transition-colors duration-200 
      ${direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize'}
    `;
    return gutterElement;
  };

  return (
    <div className={`font-sans h-screen overflow-hidden flex flex-col ${isDarkMode ? 'dark bg-[#1e1e1e] text-gray-300' : 'bg-gray-50 text-gray-800'}`}>
      <header className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-[#333333] bg-white dark:bg-[#0F0F0F]">
          <div className="flex items-center gap-4">
              <img className="w-18 h-12 cursor-pointer logo-flip" src={logo} alt="logo" onClick={() => window.location.href = '/'} />
              <h1 className="text-lg font-medium text-gray-900 dark:text-white">SQL Coderpad</h1>
              <div className="flex items-center gap-1">
                  <button onClick={() => handleQuizNavigation(-1)} disabled={currentQuestionIndex <= 0} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" title="Previous Question" >
                      <ChevronLeft size={25} />
                  </button>
                  <button onClick={() => handleQuizNavigation(1)} disabled={currentQuestionIndex >= questions.length - 1} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" title="Next Question">
                      <ChevronRight size={25} />
                  </button>
              </div>
          </div>
          <div className="flex items-center space-x-4">
              {/* <div className="font-semibold text-lg"> */}
              <button onClick={toggleTheme} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <a href="https://dashboard.datasenseai.com/practice-dashboard" className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Dashboard">
                  <LayoutDashboard className="h-4 w-4" />
              </a>
              <div className="text-sm font-medium bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md">
                  Time: {formatTime(timeRemaining)}
              </div>
              <button className="px-4 py-1.5 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50" onClick={handleSubmitQuiz} disabled={isSubmitting} >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
              <UserButton />
          </div>
      </header>

      <main className="flex-grow min-h-0">
          <Split
              className="flex h-full"
              sizes={isFolded ? [5, 95] : [45, 55]}
              minSize={isFolded ? 60 : 400}
              gutterSize={isFolded ? 0 : 4}
              gutter={gutter}
              direction="horizontal"
          >
              <div className="flex flex-col overflow-hidden bg-white dark:bg-[#262626]">
                  {isFolded ? (
                      <div className="flex flex-col items-center py-4 space-y-4 h-full">
                           <button onClick={() => setIsFolded(false)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-900" title="Unfold Panel">
                                <ChevronRight size={20} />
                           </button>
                      </div>
                  ) : (
                      <>
                          <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 dark:border-[#333333] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                              <div className="flex flex-nowrap gap-2 pb-2">
                                  {questions.map((_, index) => (
                                      <button key={index} className={`flex-shrink-0 h-8 w-8 text-sm rounded-md flex items-center justify-center transition-all duration-200 ${index === currentQuestionIndex ? 'bg-teal-500 text-white font-semibold scale-110 shadow-md' : 'bg-gray-100 dark:bg-[#252526] hover:bg-gray-200 dark:hover:bg-gray-600'} ${questionResults[index].isCorrect === true ? 'ring-2 ring-green-500' : ''} ${questionResults[index].isCorrect === false ? 'ring-2 ring-red-500' : ''} ${questionResults[index].timeUp ? 'bg-gray-400 dark:bg-gray-700 text-white line-through' : ''}`} onClick={() => handleQuestionSelect(index)}>
                                          {index + 1}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div className="flex-shrink-0 px-4 border-b border-gray-200 dark:border-[#333333] flex justify-between items-center">
                              <nav className="flex space-x-4">
                                  <button onClick={() => setActiveTab('question')} className={`py-2 px-1 text-sm font-medium transition-colors ${activeTab === 'question' ? 'border-b-2 border-teal-500 text-gray-900 dark:text-white' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                      <span className="flex items-center gap-2"><FileText className="h-5 w-5 text-[#14B8A6]" /> Question</span>
                                  </button>
                                  <button onClick={() => setActiveTab('tables')} className={`py-2 px-1 text-sm font-medium transition-colors ${activeTab === 'tables' ? 'border-b-2 border-teal-500 text-gray-900 dark:text-white' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                      <span className="flex items-center gap-2"><Table2 className="h-5 w-5 text-[#8E7128]" /> Tables</span>
                                  </button>
                              </nav>
                              <button onClick={() => setIsFolded(true)} className="p-2 -mr-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Fold Panel">
                                  <ChevronLeft size={20} />
                              </button>
                          </div>

                          {/* SECTION: Main conditional rendering for Question/Tables view */}
                          <div className="flex-grow p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-900 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            {activeTab === 'question' ? (
                                <article className="prose prose-sm dark:prose-invert max-w-none">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white m-0">{currentQuestion.title}</h2>
                                    
                                    <div className="mt-3 mb-4 flex flex-wrap items-center gap-2">
                                        {currentQuestion.difficulty && (
                                            <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full capitalize ${getDifficultyStyle(currentQuestion.difficulty)}`}>
                                                <Gauge className="h-3 w-3" />
                                                {currentQuestion.difficulty}
                                            </span>
                                        )}
                                        {currentQuestion.subtopics && currentQuestion.subtopics.length > 0 && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full capitalize bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            <NotebookText className="h-3 w-3" />
                                            {currentQuestion.subtopics.join(', ')}
                                            </span>
                                        )}
                                        {currentQuestion.ideal_time && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full capitalize bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                            <Timer className="h-3 w-3" />
                                            {currentQuestion.ideal_time}
                                            </span>
                                        )}
                                        {currentQuestion.company?.map((comp, idx) => (
                                            <span key={idx} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full capitalize bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                                            <Building2 className="h-3 w-3" />
                                            {comp}
                                            </span>
                                        ))}
                                        {currentQuestion.year && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full capitalize bg-[#f8caaa] text-[#F97316] dark:bg-[#f8caaa] dark:text-[#F97316]">
                                            <Calendar className="h-3 w-3" />
                                            {currentQuestion.year}
                                            </span>
                                        )}
                                    </div>

                                    {currentQuestion.scenario && <div dangerouslySetInnerHTML={{ __html: currentQuestion.scenario.replace(/\n/g, '<br>') }} />}
                                    <div className="mt-4 p-4 border-l-4 border-teal-500 bg-gray-50 dark:bg-[#252526]/50 rounded-r-md">
                                        <div dangerouslySetInnerHTML={{ __html: currentQuestion.question_text.replace(/\n/g, '<br>') }} />
                                    </div>

                                    {currentQuestion['data-overview'] && (
                                        <div className="mt-6">
                                            <h4 className="text-lg font-semibold mb-3">Data Overview</h4>
                                            <div className="border border-gray-200 dark:border-[#333333] rounded-md overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <tbody className="divide-y divide-gray-200 dark:divide-[#333333]">
                                                        {Array.from(parseDataOverview(currentQuestion['data-overview']).entries()).map(([key, value], index) => (
                                                            <tr key={key} className={index % 2 === 0 ? 'bg-white dark:bg-[#262626]' : 'bg-gray-50 dark:bg-[#2c2c2c]'}>
                                                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 w-1/3" dangerouslySetInnerHTML={{ __html: key }}></td>
                                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: value }}></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            ) : (
                                // SECTION: New Tables View
                                <div className="space-y-4">
                                    <nav className="flex space-x-4 border-b border-gray-200 dark:border-[#333333]">
                                        <button
                                            onClick={() => setActiveNestedTab('expected_output')}
                                            className={`py-2 px-1 text-sm font-medium ${activeNestedTab === 'expected_output' ? 'border-b-2 border-teal-500 text-gray-900 dark:text-white' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                        >
                                            Expected Output
                                        </button>
                                        {currentQuestion.table_data?.map(table => (
                                            <button
                                                key={table.table_name}
                                                onClick={() => setActiveNestedTab(table.table_name)}
                                                className={`py-2 px-1 text-sm font-medium ${activeNestedTab === table.table_name ? 'border-b-2 border-teal-500 text-gray-900 dark:text-white' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                            >
                                                {table.table_name}
                                            </button>
                                        ))}
                                    </nav>
                                    
                                    <div>
                                        {activeNestedTab === 'expected_output' && currentQuestion.expected_output && (
                                            <TableView
                                                title="Expected Output"
                                                columns={currentQuestion.expected_output.columns}
                                                rows={currentQuestion.expected_output.rows}
                                                isDarkMode={isDarkMode}
                                            />
                                        )}
                                        {currentQuestion.table_data?.map(table =>
                                            activeNestedTab === table.table_name && (
                                                <TableView
                                                    key={table.table_name}
                                                    title={`Table: ${table.table_name}`}
                                                    columns={table.columns}
                                                    rows={table.rows}
                                                    isDarkMode={isDarkMode}
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex items-center justify-between mb-1 mt-1 pl-3 pr-3 border-t border-gray-200 dark:border-[#333333]">
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setQuestionFeedback(questionFeedback === 'like' ? null : 'like')} className={`p-2 rounded-md flex items-center space-x-2 transition-colors ${questionFeedback === 'like' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`} aria-label="Like this question">
                                        <ThumbsUp size={18} />
                                    </button>
                                    <button onClick={() => setQuestionFeedback(questionFeedback === 'dislike' ? null : 'dislike')} className={`p-2 rounded-md flex items-center space-x-2 transition-colors ${questionFeedback === 'dislike' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`} aria-label="Dislike this question">
                                        <ThumbsDown size={18} />
                                    </button>
                                    <div className="w-[1px] h-6 bg-gray-200 dark:bg-[#333333] mx-1"></div>
                                    <div className="relative">
                                        <button onClick={() => setIsSharePopupOpen(p => !p)} className="p-2 rounded-md flex items-center space-x-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Share question">
                                            <Share2 size={18} />
                                        </button>
                                        {isSharePopupOpen && (
                                            <div ref={sharePopupRef} className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 rounded-lg shadow-lg bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#333333] flex items-center space-x-2 z-30">
                                                <button onClick={() => handleShareClick('copy')} title="Copy link" className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white"><Link size={16} /></button>
                                                <button onClick={() => handleShareClick('facebook')} title="Share on Facebook" className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#1877F2] text-white font-bold text-lg hover:opacity-90">f</button>
                                                <button onClick={() => handleShareClick('linkedin')} title="Share on LinkedIn" className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#0A66C2] text-white font-bold text-base hover:opacity-90">in</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-gray-900 dark:text-white font-medium">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span>{onlineCount.toLocaleString()} Online</span>
                                </div>
                          </div>
                      </>
                  )}
              </div>

              <div className="flex flex-col overflow-hidden">
                  <Split
                      className="flex flex-col h-full"
                      direction="vertical"
                      sizes={
                          verticalFoldState === 'editor_folded' ? [0, 100] :
                          verticalFoldState === 'console_folded' ? [100, 0] :
                          [65, 35]
                      }
                      minSize={verticalFoldState !== 'none' ? 40 : 100}
                      gutterSize={verticalFoldState !== 'none' ? 0 : 4}
                      gutter={gutter}
                  >
                     <div className="relative overflow-hidden bg-[#1e1e1e] flex-grow flex flex-col">
                          <div className="flex-shrink-0 h-10 bg-gray-100 dark:bg-[#333333] flex justify-between items-center px-4 z-10">
                              <span className="font-medium text-sm text-gray-800 dark:text-gray-300">MySQL Editor</span>
                              <button
                                  onClick={() => setVerticalFoldState(verticalFoldState === 'editor_folded' ? 'none' : 'editor_folded')}
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                  title={verticalFoldState === 'editor_folded' ? "Expand Editor" : "Collapse Editor"}
                              >
                                  {verticalFoldState === 'editor_folded' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                              </button>
                          </div>
                          <div className="flex-grow relative">
                              <MonacoEditor
                                  language="sql"
                                  theme={isDarkMode ? "vs-dark" : "light"}
                                  value={userQueries[currentQuestionIndex]}
                                  onChange={(value) => {
                                      const newQueries = [...userQueries];
                                      newQueries[currentQuestionIndex] = value || '';
                                      setUserQueries(newQueries);
                                  }}
                                  options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 14, automaticLayout: true }}
                              />
                          </div>
                          {verticalFoldState !== 'editor_folded' && (
                              <div className="absolute bottom-0 right-0 z-20 flex items-center justify-end space-x-3 p-3">
                                  <button
                                      className="px-4 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-gray-600 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                                      onClick={handleRunCode}
                                      disabled={isRunning || isSubmitting || !!currentResult.isCorrect || timeRemaining <= 0}
                                  >
                                      {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                      Run Code
                                  </button>
                                  <button
                                      className="px-4 py-1.5 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                                      onClick={handleTestCode}
                                      disabled={isRunning || isSubmitting || !!currentResult.isCorrect || timeRemaining <= 0}
                                  >
                                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                      Submit
                                  </button>
                              </div>
                          )}
                      </div>
                      
                      <div className="flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden h-full">
                          <div className="flex-shrink-0 h-10 bg-gray-100 dark:bg-[#333333] flex justify-between items-center px-4">
                             <span className="font-medium text-sm text-gray-800 dark:text-gray-300">Output</span>
                              <button
                                  onClick={() => setVerticalFoldState(verticalFoldState === 'console_folded' ? 'none' : 'console_folded')}
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                  title={verticalFoldState === 'console_folded' ? "Expand Console" : "Collapse Console"}
                              >
                                  {verticalFoldState === 'console_folded' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                          </div>
                         <div className="flex-grow p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                              {!feedback && !output && <div className="text-gray-500 text-sm">Run or Submit code to see results.</div>}
                              {feedback && (
                                  <div className={`flex items-start gap-3 mb-4 p-3 rounded-md text-sm ${
                                      feedback.isCorrect
                                          ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                          : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                  }`}>
                                      {feedback.isCorrect ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> : <XCircle className="h-5 w-5 mt-0.5" />}
                                      <span>{feedback.text}</span>
                                  </div>
                              )}
                              {output && (
                                  <div>
                                      <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-300">Query Result:</h4>
                                      {output.error ? (
                                          <ErrorOutput error={output} />
                                      ) : Array.isArray(output) && output.length > 0 ? (
                                          <TableOutput output={output} />
                                      ) : <p className="p-4 text-gray-500">Query executed, but returned no results.</p>}
                                  </div>
                              )}
                          </div>
                      </div>
                  </Split>
              </div>
          </Split>
      </main>
    </div>
  );
}