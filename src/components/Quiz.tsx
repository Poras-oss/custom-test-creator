import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from "./ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import StatisticsPage from './StatisticsPage'

interface Option {
  [key: string]: string
}

interface Question {
  question_text: string
  options: Option
  correct_answer: string
  difficulty?: string
  subtopic?: string
  image?: string
}

interface QuestionResult {
  difficulty: string | null
  timeTaken: number
  subtopic: string | null
  isCorrect: boolean
  question: Question
  userAnswer: string | null
  timeUp: boolean
}

interface MCQQuizProps {
  questions: Question[]
  timePerQuestion: number
  subject: string
}

export default function MCQQuiz({ questions, timePerQuestion, subject }: MCQQuizProps) {
  const { user } = useUser()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(timePerQuestion * 60)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([])
  const [shuffledOptions, setShuffledOptions] = useState<[string, string][]>([])

  useEffect(() => {
    if (questions.length > 0 && !quizCompleted) {
      setStartTime(new Date())
      const timerInterval = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(timerInterval)
            handleTimeUp()
            return timePerQuestion * 60
          }
          return prevTimer - 1
        })
      }, 1000)
      return () => clearInterval(timerInterval)
    }
  }, [currentQuestionIndex, questions, quizCompleted, timePerQuestion])

  useEffect(() => {
    const options = Object.entries(questions[currentQuestionIndex].options)
    const shuffled = options.sort(() => Math.random() - 0.5)
    setShuffledOptions(shuffled)
  }, [currentQuestionIndex, questions])

  const handleTimeUp = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion()
    } else {
      submitQuiz()
    }
  }

  const selectOption = (optionKey: string) => {
    setSelectedOption(optionKey)
  }

  const nextQuestion = () => {
    updateQuestionResult()
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedOption(null)
      setTimer(timePerQuestion * 60)
    }
  }

  const updateQuestionResult = () => {
    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = selectedOption !== null && currentQuestion.options[selectedOption] === currentQuestion.correct_answer
    
    setQuestionResults(prevResults => [
      ...prevResults,
      {
        difficulty: currentQuestion.difficulty || null,
        timeTaken: (timePerQuestion * 60) - timer,
        subtopic: currentQuestion.subtopic || null,
        isCorrect: isCorrect,
        question: currentQuestion,
        userAnswer: selectedOption ? currentQuestion.options[selectedOption] : null,
        timeUp: timer === 0
      }
    ])
  }

  const submitQuiz = async () => {
    updateQuestionResult()
    setQuizCompleted(true)

    const calculatedScore = questionResults.reduce((total, result) => result.isCorrect ? total + 1 : total, 0)
    setScore(calculatedScore)

    try {
      const response = await fetch('https://server.datasenseai.com/custom-test/submit-quiz', {
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
      })

      if (!response.ok) {
        throw new Error('Failed to submit quiz results')
      }
      toast.success('Quiz submitted successfully!')
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error('Failed to submit quiz. Please try again.')
    }
  }

  const handleSubmitClick = () => {
    if (currentQuestionIndex === questions.length - 1) {
      if (window.confirm('Are you sure you want to submit the quiz?')) {
        submitQuiz();
      }
    } else {
      nextQuestion();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <h5 className="mt-4 text-2xl font-thin text-muted-foreground">Loading...</h5>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <StatisticsPage
        testId={user?.id || 'anonymous'}
        totalTime={questionResults.reduce((total, result) => total + result.timeTaken, 0)}
        results={questionResults}
      />
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const totalTimeInMinutes = questions.length * timePerQuestion
  const totalTimeInSeconds = 0

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <Card className="w-screen h-screen flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-medium">{subject}</CardTitle>
            <div className="flex gap-4 text-sm">
              <div>
                This question: {timer >= 60 
                  ? `${Math.floor(timer / 60)}m ${timer % 60}s` 
                  : `${timer}s`
                }
              </div>
              <div>Total: {totalTimeInMinutes}:{totalTimeInSeconds.toString().padStart(2, '0')}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Question {currentQuestionIndex + 1}/{questions.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-4rem)]">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    <p className="text-base">{currentQuestion.question_text}</p>
                    {currentQuestion.image && (
                      <div className="relative h-48 w-full">
                        <img
                          src={currentQuestion.image}
                          alt="Question image"
                          className="object-contain w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Options
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-4rem)] flex flex-col">
                <ScrollArea className="flex-grow pr-4">
                  <RadioGroup value={selectedOption || ''} onValueChange={selectOption}>
                    {shuffledOptions.map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2 mb-4">
                        <RadioGroupItem value={key} id={key} />
                        <Label htmlFor={key} className="flex-1 p-4 cursor-pointer">
                          {value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
                <Button 
                  className="w-full mt-4"
                  onClick={handleSubmitClick}
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      <ToastContainer />
    </div>
  )
}

