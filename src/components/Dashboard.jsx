import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase, TABLES } from "../lib/supabase";
import {
  FileText,
  MessageCircle,
  HelpCircle,
  Trophy,
  TrendingUp,
} from "lucide-react";

export function Dashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalPdfs: 0,
    totalChats: 0,
    totalQuizzes: 0,
    averageScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [pdfsResult, chatsResult, quizzesResult, scoresResult] =
        await Promise.all([
          supabase
            .from(TABLES.PDF_DOCUMENTS)
            .select("id")
            .eq("user_id", user.id),
          supabase
            .from(TABLES.CHAT_SESSIONS)
            .select("id")
            .eq("user_id", user.id),
          supabase
            .from(TABLES.QUIZ_SESSIONS)
            .select("id")
            .eq("user_id", user.id),
          supabase
            .from(TABLES.QUIZ_SCORES)
            .select("score")
            .eq("user_id", user.id),
        ]);

      const totalPdfs = pdfsResult.data?.length || 0;
      const totalChats = chatsResult.data?.length || 0;
      const totalQuizzes = quizzesResult.data?.length || 0;

      const scores = scoresResult.data?.map((s) => s.score) || [];
      const averageScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      setStats({
        totalPdfs,
        totalChats,
        totalQuizzes,
        averageScore,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "PDFs Uploaded",
      value: stats.totalPdfs,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Chat Sessions",
      value: stats.totalChats,
      icon: MessageCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Quizzes Taken",
      value: stats.totalQuizzes,
      icon: HelpCircle,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Average Score",
      value: `${stats.averageScore}%`,
      icon: Trophy,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
