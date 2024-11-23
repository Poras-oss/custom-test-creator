import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';




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

  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if(formData.topic === 'sql' && formData.questionType === 'coding'){
        const newWindow = window.open('/quiz', '_blank');
        if (newWindow) newWindow.focus();
      }else if(formData.topic === 'python' && formData.questionType === 'coding'){
        const newWindow = window.open('/python-coding-quiz', '_blank');
        if (newWindow) newWindow.focus();
      }else{
        const newWindow = window.open('/mcq-quiz', '_blank');
        if (newWindow) newWindow.focus();
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
    <div className="mx-auto max-w">
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Test</CardTitle>
          <CardDescription>Configure your test settings below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form content */}
            <div className="space-y-4">
              {/* Question Pool */}
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
              
              {/* Include Attempted Questions */}
              <div className="flex items-center justify-between">
                <Label htmlFor="includeAttempted">Include Attempted Questions</Label>
                <Switch
                  id="includeAttempted"
                  checked={formData.includeAttempted}
                  onCheckedChange={(checked) => setFormData({ ...formData, includeAttempted: checked })}
                />
              </div>
              
              {/* Number of Questions */}
              <div className="space-y-2">
                <Label>Number of Questions: {formData.numQuestions}</Label>
                <Slider
                  value={[formData.numQuestions]}
                  onValueChange={([value]) => setFormData({ ...formData, numQuestions: value })}
                  min={5}
                  max={50}
                  step={5}
                />
              </div>
              
              {/* Topic */}
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
              
              {/* Question Type */}
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
              
              {/* Difficulty */}
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
              
              {/* Time per Question */}
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

            {/* Submit Button */}
            <div className="flex items-center justify-center">
              <Button type="submit" className="w-1/3" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Loading...' : 'Create Test'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
