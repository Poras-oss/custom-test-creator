"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2 } from 'lucide-react';
import StatisticsPage from "./StatisticsPage";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from 'lucide-react';
import { Button } from "./ui/button";

interface Question {
  difficulty: string;
  timeTaken: number;
  subtopic: string | null;
  isCorrect: boolean;
  question: {
    _id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    difficulty: string;
  };
  userAnswer: string;
  timeUp: boolean;
  _id: string;
}

interface Submission {
  submittedAt: string;
  subject: string;
  questions: Question[];
  _id: string;
}

interface CustomTest {
  submissions: Submission[];
}

// Add this interface to match the expected ResultType
interface ResultType {
  difficulty: string;
  timeTaken: number;
  subtopic: string | null;
  isCorrect: boolean;
  question: {
    question_text: string;
    options: { [key: string]: string };
    correct_answer: string;
    difficulty?: string;
  };
  userAnswer: string | null;
  timeUp: boolean;
}

export default function CustomTestList() {
  const { user, isLoaded } = useUser();
  const [customTest, setCustomTest] = useState<CustomTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    const fetchTests = async () => {
      if (user) {
        try {
          const response = await fetch(`https://server.datasenseai.com/custom-test/submissions/${user.id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch tests");
          }
          const data = await response.json();
          console.log(data);
          setCustomTest(data.data);
        } catch (error) {
          console.error("Error fetching tests:", error);
          setError("Failed to load tests. Please try again later.");
        } finally {
          setLoading(false);
        }
      } else if (isLoaded) {
        setLoading(false);
      }
    };

    fetchTests();
  }, [user, isLoaded]);

  const handleSubmissionClick = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const handleBackClick = () => {
    setSelectedSubmission(null);
  };

  if (!isLoaded || loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <h5 className={`${isDarkTheme ? "mt-4 text-2xl font-thin text-white-700" : "mt-4 text-2xl font-thin text-gray-700"}`}>Loading...</h5>
        
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please log in to view your custom tests.
              </AlertDescription>
            </Alert>
            <SignInButton mode="modal" fallbackRedirectUrl={'/'} signUpForceRedirectUrl={'/'}>
            <Button className="mt-2">
              Sign In
            </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (selectedSubmission) {
    const formattedResults: ResultType[] = selectedSubmission.questions.map(q => ({
      difficulty: q.difficulty,
      timeTaken: q.timeTaken,
      subtopic: q.subtopic,
      isCorrect: q.isCorrect,
      question: {
        question_text: q.question?.question_text || 'Dummy question text',
        options: q.question?.options
          ? q.question.options.reduce((acc, option, index) => {
              acc[String.fromCharCode(65 + index)] = option;
              return acc;
            }, {} as { [key: string]: string })
          : { A: 'Dummy option A', B: 'Dummy option B', C: 'Dummy option C', D: 'Dummy option D' },
        correct_answer: q.question?.correct_answer || 'A',
        difficulty: q.question?.difficulty || q.difficulty,
      },
      userAnswer: q.userAnswer,
      timeUp: q.timeUp,
    }));

    const totalTime = selectedSubmission.questions.reduce((total, q) => total + (q.timeTaken || 0), 0);

    return (
      <div className="w-full p-6"> {/* Full width */}
        <Button onClick={handleBackClick} className="mb-4">Back to List</Button>
        <StatisticsPage
          testId={selectedSubmission._id}
          results={formattedResults}
          totalTime={totalTime}
        />
      </div>
    );
  }

  return (
    <div className="w-full p-6"> {/* Full width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Your Custom Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[100vh]">
            {!customTest || !customTest.submissions || customTest.submissions.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No tests found.</p>
            ) : (
              customTest.submissions.slice().reverse().map((submission, index) => (
                <Card
                  key={submission._id}
                  className="mb-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSubmissionClick(submission)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {submission.subject || `Test ${index + 1}`}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          Score: {submission.questions.filter((q) => q.isCorrect).length} /{" "}
                          {submission.questions.length}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Time:{" "}
                          {(
                            submission.questions.reduce(
                              (total, q) => total + (q.timeTaken || 0),
                              0
                            ) / 60
                          ).toFixed(2)}{" "}
                          minutes
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
