import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Loader2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useUser, SignInButton } from '@clerk/clerk-react';
import { AlertCircle } from 'lucide-react';



interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  topic: string;
  type: string;
}


interface QuizState {
  questions: Question[];
  timePerQuestion: number;
}

const HomePage: React.FC = () => {
  const [formData, setFormData] = useState({
    questionPool: 'free',
    includeAttempted: false,
    numQuestions: 10,
    topic: '',
    questionType: '',
    subtopic: '',
    difficulty: '',
    timePerQuestion: 5,
  });

  const { isLoaded, isSignedIn, user } = useUser() 

  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!formData.topic) return "Please select a topic.";
    if (!formData.questionType) return "Please select a question type.";
    if (!formData.difficulty) return "Please select a difficulty level.";
    return null;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) {
      setError('Authentication is still loading. Please wait.');
      return;
    }

    if (!user) {
      setError('You must be logged in to create a test.');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    setLoading(true);
    setError(null);

    try {
      
      let response;

      if(formData.questionType === 'coding'){
         response = await fetch(
          `https://server.datasenseai.com/test-series-coding/custom-questions?topic=${formData.topic}&type=${formData.questionType}&difficulty=${formData.difficulty}&numQuestions=${formData.numQuestions}`
        );
      }else{
        response = await fetch(
          `https://server.datasenseai.com/test-series-mcq/custom-questions?topic=${formData.topic}&type=${formData.questionType}&difficulty=${formData.difficulty}&numQuestions=${formData.numQuestions}`
        );
      }

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data);
      setShowQuiz(true); // Show QuizApp when questions are received
      //  console.log(data);

      // Store questions in sessionStorage to access them in the new tab
      sessionStorage.setItem('quizQuestions', JSON.stringify(data));
      sessionStorage.setItem('timePerQuestion', formData.timePerQuestion.toString());

      if(formData.questionType === 'mcq'){
        sessionStorage.setItem('subject', formData.topic);
      }

    
      
      
      // Option 1: Open in new tab
      // if(formData.topic === 'sql' && formData.questionType === 'coding'){
      //   const newWindow = window.open('/quiz', '_blank');
      //   if (newWindow) newWindow.focus();
      // }else if(formData.topic === 'python' && formData.questionType === 'coding'){
      //   const newWindow = window.open('/python-coding-quiz', '_blank');
      //   if (newWindow) newWindow.focus();
      // }else{
      //   const newWindow = window.open('/mcq-quiz', '_blank');
      //   if (newWindow) newWindow.focus();
      // }

      //option 2: open in same tab
      if(formData.topic === 'sql' && formData.questionType === 'coding'){
        navigate('/quiz', { state: { questions: data } });
      }else if(formData.topic === 'python' && formData.questionType === 'coding'){
        navigate('/python-coding-quiz', { state: { questions: data } });
      } else {
        navigate('/mcq-quiz', { state: { questions: data } });
      }

    


      // Navigate to QuizApp full screen with questions
      // navigate('/sql-coderpad', { state: { questions: data } });
    } catch (err) {
      setError('An error occurred while fetching questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // if (showQuiz && questions.length > 0) {
  //   return <QuizApp questions={questions} />;
  // }

  return (
    <div className="w-full px-0"> {/* Full width, no horizontal padding */}
      <div className="mb-6 w-full rounded-none shadow-lg bg-gradient-to-r from-[#096c6c] via-[#279999] to-[#50ebec]">
        <div className="p-6 w-full">
          <div className="flex flex-col md:flex-row items-start w-full">
            <div className="flex-1 text-left mb-4 md:mb-0 w-full">
              <h2 className="text-xl md:text-3xl font-bold text-white mb-2 animate-bounce-short text-left">
                You're a premium member!
              </h2>
              <p className="text-white text-xs md:text-base leading-relaxed animate-fade-in-up text-left">
                Enjoy unlimited access to all test series, Q&A sessions, and the exclusive coderpad. Keep pushing your limits and excelling!
              </p>
            </div>
            <div className="flex-shrink-0">
              <Star className="w-16 h-10 text-[#096c6c]" />
            </div>
          </div>
        </div>
      </div>

      {/* Card removed, form is now direct child */}
      <div className="w-full p-0">
        <div className="w-full text-left mb-2">
          <h3 className="text-2xl font-bold">Create Custom Test</h3>
          <p className="text-muted-foreground">Configure your test settings below</p>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="space-y-4 w-full">
              <div className="flex items-center justify-between">
                <Label htmlFor="questionPool">Question Pool</Label>
                <Select
                  value={formData.questionPool}
                  onValueChange={(value) => setFormData({ ...formData, questionPool: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select pool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="includeAttempted">Include Attempted Questions</Label>
                <Switch
                  id="includeAttempted"
                  checked={formData.includeAttempted}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeAttempted: checked })}
                />
              </div>
              
              <div className="space-y-2 ">
                <Label>Number of Questions: {formData.numQuestions}</Label>
                <Slider
                  value={[formData.numQuestions]}
                  onValueChange={([value]) => setFormData({ ...formData, numQuestions: value })}
                  min={5}
                  max={50}
                  step={5}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="topic">Topic</Label>
                <Select
                  value={formData.topic}
                  onValueChange={(value) => setFormData({ ...formData, topic: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="questionType">Question Type</Label>
                <Select
                  value={formData.questionType}
                  onValueChange={(value) => setFormData({ ...formData, questionType: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="mcq">MCQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Basic</SelectItem>
                    <SelectItem value="medium">Intermediate</SelectItem>
                    <SelectItem value="advance">Advanced</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Time per Question (minutes): {formData.timePerQuestion}</Label>
                <Slider
                  value={[formData.timePerQuestion]}
                  onValueChange={([value]) => setFormData({ ...formData, timePerQuestion: value })}
                  min={1}
                  max={15}
                  step={1}
                />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <Button type="submit" className="w-1/3 bg-[#096c6c] hover:bg-[#50ebec] text-white" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Loading...' : 'Create Test'}
              </Button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default HomePage;
