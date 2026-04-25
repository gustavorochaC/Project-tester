"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { postTypeColors, postTypeLabels } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  title: string;
  type: string;
  date: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 1));
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthName = currentDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const getPostsForDay = (day: number) => {
    const dateStr = `2025-04-${day.toString().padStart(2, "0")}`;
    return posts.filter((p) => p.date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendario</h2>
          <p className="text-muted-foreground">
            Visualize todos os posts do mes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <CalendarIcon className="h-4 w-4" />
            <span className="font-medium capitalize">{monthName}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-7 gap-px bg-border">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
              <div
                key={day}
                className="bg-card p-3 text-center text-sm font-medium"
              >
                {day}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px bg-border">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card min-h-[120px] p-2" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, day) => {
              const dayNumber = day + 1;
              const dayPosts = getPostsForDay(dayNumber);
              return (
                <div
                  key={dayNumber}
                  className="bg-card min-h-[120px] p-2 space-y-1"
                >
                  <span className="text-sm font-medium">{dayNumber}</span>
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className={cn(
                        "rounded px-2 py-1 text-xs border",
                        postTypeColors[post.type as keyof typeof postTypeColors]
                      )}
                    >
                      {post.title.substring(0, 25)}...
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        {Object.entries(postTypeLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded", postTypeColors[key as keyof typeof postTypeColors])} />
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
