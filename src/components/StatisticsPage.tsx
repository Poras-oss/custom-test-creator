import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Pie, PieChart, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart'
import { Progress } from './ui/progress'

interface QuestionResult {
  subtopic: string
  difficulty: string
  isCorrect: boolean
  timeTaken: number
}

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


interface PythonQuestionResult {
  difficulty: string;
  timeTaken: number;
  subtopic: string;
  isCorrect: boolean | null;
  question: Question;
  userAnswer: string | null;
  timeUp: boolean;
  questionIndex: number; // Add this line
}


interface TableData {
  table_name: string;
  columns: string[];
  rows: any[][];
}
interface ExpectedOutput {
  columns: string[];
  rows: any[][];
}

interface SqlQuestion {
  question_text: string;
  expected_output: ExpectedOutput;
  difficulty?: string;
  subtopic?: string;
  video?: string;
  table_data?: TableData[];
}

interface SqlQuestionResult {
  difficulty: string | null;
  timeTaken: number;
  subtopic: string | null;
  isCorrect: boolean | null;
  question: SqlQuestion | null;
  userAnswer: any | null;
  timeUp: boolean;
}

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

interface McqQuestionResult {
  difficulty: string | null;
  timeTaken: number;
  subtopic: string | null;
  isCorrect: boolean;
  question: McqQuestion;
  userAnswer: string | null;
  timeUp: boolean;
}



type ResultType = QuestionResult | PythonQuestionResult | SqlQuestionResult | McqQuestionResult;

interface StatisticsProps {
  testId: string;
  results: ResultType[];
  totalTime: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const StatisticsPage: React.FC<StatisticsProps> = ({ testId, results, totalTime }) => {
  const totalQuestions = results.length
  const correctAnswers = results.filter(r => r.isCorrect).length
  const accuracy = (correctAnswers / totalQuestions) * 100

  const subtopicData = results.reduce((acc, result) => {
    const existingSubtopic = acc.find(item => item.name === result.subtopic)
    if (existingSubtopic) {
      result.isCorrect ? existingSubtopic.correct++ : existingSubtopic.incorrect++
      existingSubtopic.total++
    } else {
      acc.push({
        name: result.subtopic || 'Unknown',
        correct: result.isCorrect ? 1 : 0,
        incorrect: result.isCorrect ? 0 : 1,
        total: 1
      })
    }
    return acc
  }, [] as { name: string; correct: number; incorrect: number; total: number }[])

  const difficultyData = results.reduce((acc, result) => {
    const existingDifficulty = acc.find(item => item.name === result.difficulty)
    if (existingDifficulty) {
      result.isCorrect ? existingDifficulty.correct++ : existingDifficulty.incorrect++
      existingDifficulty.total++
    } else {
      acc.push({
        name: result.difficulty || 'Unknown',
        correct: result.isCorrect ? 1 : 0,
        incorrect: result.isCorrect ? 0 : 1,
        total: 1
      })
    }
    return acc
  }, [] as { name: string; correct: number; incorrect: number; total: number }[])

  const timeDistributionData = [
    { name: '0-30s', value: results.filter(r => r.timeTaken <= 30).length },
    { name: '31-60s', value: results.filter(r => r.timeTaken > 30 && r.timeTaken <= 60).length },
    { name: '61-90s', value: results.filter(r => r.timeTaken > 60 && r.timeTaken <= 90).length },
    { name: '91-120s', value: results.filter(r => r.timeTaken > 90 && r.timeTaken <= 120).length },
    { name: '>120s', value: results.filter(r => r.timeTaken > 120).length },
  ]

  const averageTimePerQuestion = totalTime / totalQuestions

  const chartConfig = {
    correct: {
      label: "Correct",
      color: "hsl(var(--primary))",
    },
    incorrect: {
      label: "Incorrect",
      color: "hsl(var(--destructive))",
    },
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold">Quiz Performance Statistics</h1>
      <p className="text-muted-foreground">Test ID: {testId}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex justify-between items-center">
              <span>Total Score:</span>
              <span className="font-bold">{correctAnswers} / {totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Accuracy:</span>
              <span className="font-bold">{accuracy.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Time:</span>
              <span className="font-bold">{(totalTime / 60).toFixed(2)} minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Average Time per Question:</span>
              <span className="font-bold">{averageTimePerQuestion.toFixed(2)} seconds</span>
            </div>
            <div>
              <span className="block mb-2">Overall Progress:</span>
              <Progress value={accuracy} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {timeDistributionData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results by Subtopic</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subtopicData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" fill="var(--color-correct)" stackId="a" name="Correct" />
                  <Bar dataKey="incorrect" fill="var(--color-incorrect)" stackId="a" name="Incorrect" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" fill="var(--color-correct)" stackId="a" name="Correct" />
                  <Bar dataKey="incorrect" fill="var(--color-incorrect)" stackId="a" name="Incorrect" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance by Subtopic</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subtopicData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" fill="var(--color-correct)" name="Correct" />
                  <Bar dataKey="total" fill="var(--color-total)" name="Total Questions" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultyData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" fill="var(--color-correct)" name="Correct" />
                  <Bar dataKey="total" fill="var(--color-total)" name="Total Questions" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default StatisticsPage