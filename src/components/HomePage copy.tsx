import React, { useState, useEffect, useContext } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Flame, Target, Lock, Sparkles, Hash, Clock, HelpCircle, Gamepad2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AlertCircle } from 'lucide-react';
import { DarkModeContext } from '../App';

const ControlButton = ({ active, children, isDarkTheme, ...props }: { active: boolean; children: React.ReactNode; isDarkTheme: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`flex-1 px-4 py-2.5 rounded-lg text-base font-semibold transition-all duration-300 ${
      active 
        ? 'bg-teal-500 text-white shadow-lg' 
        : isDarkTheme
        ? 'bg-[#2f2f2f] text-gray-100 hover:bg-gray-600 border-gray-500'
        : 'bg-[#D1D1D1] text-gray-600 hover:bg-gray-300 border-gray-200'
    }`}
  >
    {children}
  </button>
);

const CustomSwitch = ({ active, locked = false, children, isDarkTheme, ...props }: { active: boolean; locked?: boolean; children: React.ReactNode; isDarkTheme: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <div className="flex items-center justify-between w-full py-1">
        <span className={`font-semibold text-base ${locked ? 'text-slate-500' : (isDarkTheme ? 'text-gray-100' : 'text-gray-600')}`}>{children}</span>
        <button {...props} disabled={locked} className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 ${isDarkTheme ? 'focus:ring-offset-slate-800' : 'focus:ring-offset-white'} focus:ring-cyan-500 ${active ? 'bg-teal-500' : (isDarkTheme ? 'bg-[#2f2f2f]' : 'bg-[#D1D1D1]')} ${locked ? 'cursor-not-allowed' : ''}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${active ? 'transform translate-x-6' : ''}`}></span>
            {locked && <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-slate-400" />}
        </button>
    </div>
);

const CircularProgress = ({ value, max, size = 100, isDarkTheme }: { value: number; max: number; size?: number; isDarkTheme: boolean }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const circumference = 2 * Math.PI * (size / 2 - 8);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 8} stroke={isDarkTheme ? "rgb(47 47 47)" : "rgb(209 209 209)"} strokeWidth="8" fill="transparent" />
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 8} stroke="rgb(20 184 166)" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-300 ease-in-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{value}</span>
          <span className={`text-sm ${isDarkTheme ? 'text-slate-400' : 'text-gray-500'}`}>/{max}</span>
        </div>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [formData, setFormData] = useState({
    numQuestions: 10,
    topic: 'sql',
    questionType: 'coding',
    subtopics: [] as string[],
    difficulty: 'easy',
    timePerQuestion: 1,
  });

  const [quizMode, setQuizMode] = useState('practice');
  const [solvedQuestions, setSolvedQuestions] = useState(new Set<string>());
  const [totalQuestions] = useState(500);

  const { isLoaded, user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isDarkTheme } = useContext(DarkModeContext);

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const subTopics: { [key: string]: string[] } = {
    sql: ['Selection', 'Filtering', 'Sorting', 'Limit', 'Aggregation', 'Group By', 'Having', 'Joins', 'Self Join', 'Cross Join', 'Conditional Statements', 'Case When', 'Date Functions', 'String Functions', 'Numeric Functions', 'Subquery', 'CTE', 'Ranking Functions', 'Window Functions', 'Top N', 'UNION', 'Regular Expressions', 'Time Functions']
  };

  useEffect(() => {
    const fetchSolvedQuestions = async () => {
      if (!user || !user.id) return;
      try {
        const response = await fetch(`https://server.datasenseai.com/question-attempt/solved/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          const solvedSet = new Set<string>(data.solvedQuestions.filter((item: string | null) => item !== null));
          setSolvedQuestions(solvedSet);
        } else {
          console.error("Failed to fetch solved questions");
        }
      } catch (error) {
        console.error("Error fetching solved questions:", error);
      }
    };
    if (isLoaded && user) {
      fetchSolvedQuestions();
    }
  }, [isLoaded, user]);

  const isButtonActive = formData.topic && formData.questionType && formData.difficulty;

  const validateForm = (): string | null => {
    if (!formData.topic) return "Please select a topic.";
    if (!formData.questionType) return "Please select a question type.";
    if (!formData.difficulty) return "Please select a difficulty level.";
    return null;
  };
  
  // FIXED: This is a hybrid function that handles BOTH SQL Coding and MCQ quiz creation correctly.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) { setError('Authentication is still loading. Please wait.'); return; }
    if (!user) { setError('You must be logged in to create a test.'); return; }
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);

    try {
        // --- Logic for SQL Coding Quiz ---
        if (formData.topic === 'sql' && formData.questionType === 'coding') {
            const endpoint = 'https://server.datasenseai.com/test-series-coding/mysql';
            const params = new URLSearchParams({ difficulties: formData.difficulty });
            if (formData.subtopics.length > 0) {
                params.append('subtopics', formData.subtopics.join(','));
            }
            
            const response = await fetch(`${endpoint}?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch SQL questions.');

            const responseData = await response.json();
            let filteredQuestions = responseData.results || [];
            if (filteredQuestions.length === 0) throw new Error('No SQL questions found for the selected criteria.');

            const shuffledQuestions = shuffleArray(filteredQuestions);
            const quizQuestions = shuffledQuestions.slice(0, formData.numQuestions);

            sessionStorage.setItem('quizQuestions', JSON.stringify(quizQuestions));
            sessionStorage.setItem('timePerQuestion', formData.timePerQuestion.toString());
            navigate('/quiz');

        } else {
            // --- Logic for MCQ and other quiz types ---
            const endpoint = formData.questionType === 'coding' ? 'test-series-coding' : 'test-series-mcq';
            let apiUrl = `https://server.datasenseai.com/${endpoint}/custom-questions?topic=${formData.topic}&type=${formData.questionType}&difficulty=${formData.difficulty}&numQuestions=${formData.numQuestions}`;
            if (formData.subtopics.length > 0) {
                apiUrl += `&subtopics=${encodeURIComponent(formData.subtopics.join(','))}`;
            }

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch questions for the selected criteria.');

            const data = await response.json();
            if(data.length === 0) throw new Error('No questions found for the selected criteria.');

            sessionStorage.setItem('quizQuestions', JSON.stringify(data));
            sessionStorage.setItem('timePerQuestion', formData.timePerQuestion.toString());
            
            if (formData.questionType === 'mcq') {
                sessionStorage.setItem('subject', formData.topic);
            }

            if (formData.topic === 'python' && formData.questionType === 'coding') {
                navigate('/python-coding-quiz');
            } else {
                navigate('/mcq-quiz');
            }
        }
    } catch (err: any) {
        setError(err.message || 'An error occurred while fetching questions. Please try again.');
    } finally {
        setLoading(false);
    }
  };
  
  const handleSubtopicClick = (subtopic: string) => {
    setFormData(prev => {
        const currentSubtopics = prev.subtopics;
        const isSelected = currentSubtopics.includes(subtopic);
        if (isSelected) {
            return { ...prev, subtopics: currentSubtopics.filter(s => s !== subtopic) };
        } else {
            return { ...prev, subtopics: [...currentSubtopics, subtopic] };
        }
    });
  };

  const currentSubtopics = subTopics[formData.topic] || [];

  return (
    <div className={`h-full overflow-hidden p-6 ${isDarkTheme ? "dark bg-[#1D1E23] text-white" : "bg-gray-100 text-gray-800"} flex flex-col`}>
      <div className="text-left mb-6 flex-shrink-0">
          <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Create Your SQL Quiz</h1>
          <p className={`${isDarkTheme ? 'text-slate-400' : 'text-gray-600'} mt-1 text-base`}>Customize Your quiz the way you want - difficulty, time, and topic at your fingertips. Keep pushing you limits and excelling!</p>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className={`${isDarkTheme ? 'bg-[#32363C]' : 'bg-white border border-gray-200'} p-5 rounded-xl`}>
            <h3 className={`font-semibold mb-3 ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'} text-base flex items-center`}><Sparkles className="text-[#ff6397] w-5 h-5 mr-2" />Difficulty</h3>
            <div className="flex space-x-3 mb-5">
                <ControlButton isDarkTheme={isDarkTheme} active={formData.difficulty === 'easy'} onClick={() => setFormData(f => ({ ...f, difficulty: 'easy' }))}>Beginner</ControlButton>
                <ControlButton isDarkTheme={isDarkTheme} active={formData.difficulty === 'medium'} onClick={() => setFormData(f => ({ ...f, difficulty: 'medium' }))}>Intermediate</ControlButton>
                <ControlButton isDarkTheme={isDarkTheme} active={formData.difficulty === 'advanced'} onClick={() => setFormData(f => ({ ...f, difficulty: 'advanced' }))}>Advanced</ControlButton>
            </div>
            <h3 className={`font-semibold mb-3 ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'} text-base flex items-center`}><Hash className="text-[#ffcc4a] w-5 h-5 mr-2" />Number of Questions</h3>
            <Slider
                value={[formData.numQuestions]}
                onValueChange={([v]) => setFormData(f => ({ ...f, numQuestions: v }))}
                min={5} max={25} step={5}
                className="[&>span:first-child]:h-1.5 [&>span:first-child>span]:bg-teal-500 [&>a]:bg-white [&>a]:w-4 [&>a]:h-4"
            />
            <div className={`flex justify-between text-sm ${isDarkTheme ? 'text-slate-200' : 'text-gray-500'} mt-2`}>
                <span>5</span><span>10</span><span>15</span><span>20</span><span>25</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
              <div className={`${isDarkTheme ? 'bg-[#32363C]' : 'bg-white border border-gray-200'} p-5 rounded-xl flex flex-col gap-12`}>
                  <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'} text-base flex items-center`}><Clock className="text-[#64ff86] w-5 h-5 mr-2" />Time Per Question</h3>
                      <Select
                        value={String(formData.timePerQuestion)}
                        onValueChange={(value) => setFormData(f => ({...f, timePerQuestion: Number(value)}))}
                      >
                          <SelectTrigger className={`w-[160px] ${isDarkTheme ? 'bg-[#2f2f2f]' : 'bg-white'} font-semibold text-base`}>
                              <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className={`${isDarkTheme ? 'bg-[#2f2f2f] border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
                              <SelectItem value="1">1 Min</SelectItem>
                              <SelectItem value="2">2 Mins</SelectItem>
                              <SelectItem value="5">5 Mins</SelectItem>
                              <SelectItem value="10">10 Mins</SelectItem>
                              <SelectItem value="15">15 Mins</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className='space-y-2'>
                      <h3 className={`font-semibold ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'} text-base flex items-center`}><HelpCircle className="text-[#ffa768] w-5 h-5 mr-2" />Question type</h3>
                      <div className='flex flex-col space-y-2'>
                        <div className='flex space-x-4'>
                        <CustomSwitch isDarkTheme={isDarkTheme} active={formData.questionType === 'mcq'} onClick={() => setFormData(f => ({ ...f, questionType: 'mcq' }))}>MCQ</CustomSwitch>
                        <CustomSwitch isDarkTheme={isDarkTheme} active={formData.questionType === 'coding'} onClick={() => setFormData(f => ({ ...f, questionType: 'coding' }))}>Query Writing</CustomSwitch>
                        <CustomSwitch isDarkTheme={isDarkTheme} active={false} locked>Debugging</CustomSwitch>
                        </div>
                      </div>
                  </div>
                  <div>
                      <h3 className={`font-semibold ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'} text-base flex items-center mb-2`}><Gamepad2 className="text-[#00c8ff] w-5 h-5 mr-2" />Quiz Mode</h3>
                      <div className="flex space-x-2">
                        <ControlButton isDarkTheme={isDarkTheme} active={quizMode === 'exam'} onClick={() => setQuizMode('exam')}>Exam Mode</ControlButton>
                        <ControlButton isDarkTheme={isDarkTheme} active={quizMode === 'practice'} onClick={() => setQuizMode('practice')}>Practice Mode</ControlButton>
                        <button disabled className={`flex-1 px-4 py-2.5 rounded-lg text-base font-semibold text-slate-500 ${isDarkTheme
                          ? 'bg-[#2f2f2f]'
                          : 'bg-[#D1D1D1]'
                          } cursor-not-allowed flex items-center justify-center`}>
                            <Lock className="w-4 h-4 mr-1.5" /> Challenge
                        </button>
                      </div>
                  </div>
              </div>
              <div className={`${isDarkTheme ? 'bg-[#32363C]' : 'bg-white border border-gray-200'} p-5 rounded-xl flex flex-col`}>
                <h3 className={`font-semibold mb-3 ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'} text-base flex items-center`}><Filter className="text-[#76ff73] w-5 h-5 mr-2" />Sub Topics</h3>
                <div className="flex flex-wrap gap-2 overflow-y-auto">
                    {currentSubtopics.map(sub => (
                        <button key={sub} onClick={() => handleSubtopicClick(sub)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                                formData.subtopics.includes(sub)
                                ? 'bg-teal-500 text-white border-teal-500'
                                : isDarkTheme
                                ? 'bg-[#2f2f2f] text-gray-100 hover:bg-gray-600 border-gray-500'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
                            }`}
                        >{sub}</button>
                    ))}
                </div>
              </div>
          </div>
        </div>

        <div className={`${isDarkTheme ? 'bg-[#32363C]' : 'bg-white border border-gray-200'} rounded-xl flex flex-col gap-2 min-h-0`}>
          <div className="p-5 flex flex-col items-center space-y-3">
              <CircularProgress isDarkTheme={isDarkTheme} value={solvedQuestions.size} max={totalQuestions} size={120} />
              <h4 className={`font-semibold text-base ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'}`}>Solved Questions</h4>
          </div>
          <div className="pl-5 pr-5 flex justify-between items-center">
              <h4 className={`font-semibold text-base ${isDarkTheme ? 'text-slate-300' : 'text-gray-700'}`}>Current streak:</h4>
              <div className="flex items-center space-x-1.5 text-orange-400"><Flame className="w-6 h-6"/><span className="text-2xl font-bold">3</span></div>
          </div>
          <div className="p-5 flex flex-col">
            <h3 className={`text-xl font-bold mb-5 flex items-center flex-shrink-0 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}><Target className="w-6 h-6 mr-2 text-cyan-400"/> Quiz Preview</h3>
            <div className="space-y-4 text-base">
                <div className="flex justify-between"><span className={isDarkTheme ? 'text-slate-400' : 'text-gray-500'}>Difficulty:</span> <span className="font-medium capitalize">{formData.difficulty}</span></div>
                <div className="flex justify-between"><span className={isDarkTheme ? 'text-slate-400' : 'text-gray-500'}>Questions:</span> <span className="font-medium">{formData.numQuestions}</span></div>
                <div className="flex justify-between"><span className={isDarkTheme ? 'text-slate-400' : 'text-gray-500'}>Time per Q:</span> <span className="font-medium">{formData.timePerQuestion} Min</span></div>
                <div className="flex justify-between"><span className={isDarkTheme ? 'text-slate-400' : 'text-gray-500'}>Type:</span> <span className="font-medium capitalize">{formData.questionType === 'coding' ? 'Query Writing' : 'MCQ'}</span></div>
                <div className="flex justify-between"><span className={isDarkTheme ? 'text-slate-400' : 'text-gray-500'}>Mode:</span> <span className="font-medium capitalize">{quizMode} Mode</span></div>
            </div>
            <Button onClick={handleSubmit} className="w-full mt-4 disabled:opacity-50 bg-teal-500 text-white shadow-lg hover:bg-teal-400 font-semibold py-3 text-base" disabled={!isButtonActive || loading}>
               {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Quiz...</> : 'Create Quiz'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;