import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrophyIcon,
  CalendarIcon,
  UsersIcon,
} from "lucide-react";

interface Player {
  id: string;
  handle: string;
  firstName: string;
  lastName: string;
  eloChange: number;
  avatarUrl?: string;
}

interface Match {
  id: string;
  name: string;
  map: string;
  date: string;
  team1: {
    players: string[];
    isWinner: boolean;
  };
  team2: {
    players: string[];
    isWinner: boolean;
  };
  status: "completed" | "in-progress" | "cancelled";
}

interface DashboardWidgetsProps {
  topEloChanges?: Player[];
  recentMatches?: Match[];
}

const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  topEloChanges = [
    {
      id: "1",
      handle: "Viper",
      firstName: "Ørjan",
      lastName: "Larsen",
      eloChange: 24,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=viper",
    },
    {
      id: "2",
      handle: "DauT",
      firstName: "Darko",
      lastName: "Dautovic",
      eloChange: 18,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=daut",
    },
    {
      id: "3",
      handle: "Hera",
      firstName: "Hamzah",
      lastName: "El-Baher",
      eloChange: -12,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=hera",
    },
    {
      id: "4",
      handle: "TaToH",
      firstName: "Iago",
      lastName: "González",
      eloChange: -15,
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=tatoh",
    },
  ],
  recentMatches = [
    {
      id: "1",
      name: "Red Champions",
      map: "Arabia",
      date: "2023-06-15T14:30:00Z",
      team1: {
        players: ["Viper", "DauT"],
        isWinner: true,
      },
      team2: {
        players: ["Hera", "TaToH"],
        isWinner: false,
      },
      status: "completed",
    },
    {
      id: "2",
      name: "Blue Paladins",
      map: "Black Forest",
      date: "2023-06-12T18:45:00Z",
      team1: {
        players: ["Viper", "Hera"],
        isWinner: false,
      },
      team2: {
        players: ["DauT", "TaToH"],
        isWinner: true,
      },
      status: "completed",
    },
    {
      id: "3",
      name: "Green Archers",
      map: "Arena",
      date: "2023-06-10T20:15:00Z",
      team1: {
        players: ["Viper", "TaToH"],
        isWinner: true,
      },
      team2: {
        players: ["DauT", "Hera"],
        isWinner: false,
      },
      status: "completed",
    },
    {
      id: "4",
      name: "Yellow Knights",
      map: "Gold Rush",
      date: "2023-06-08T19:00:00Z",
      team1: {
        players: ["DauT", "Hera"],
        isWinner: true,
      },
      team2: {
        players: ["Viper", "TaToH"],
        isWinner: false,
      },
      status: "completed",
    },
  ],
}) => {
  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="w-full bg-background p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ELO Changes Widget */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrophyIcon className="h-6 w-6 text-yellow-500" />
              Top ELO Changes
            </CardTitle>
            <CardDescription>
              Highest ELO changes in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEloChanges.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={player.avatarUrl} alt={player.handle} />
                      <AvatarFallback>
                        {player.handle.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{player.handle}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.firstName} {player.lastName}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1 ${player.eloChange > 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {player.eloChange > 0 ? (
                      <ArrowUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4" />
                    )}
                    <span className="font-bold">
                      {player.eloChange > 0 ? "+" : ""}
                      {player.eloChange}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Matches Widget */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <UsersIcon className="h-6 w-6 text-blue-500" />
              Recent Matches
            </CardTitle>
            <CardDescription>Latest matches and their results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMatches.map((match) => (
                <div key={match.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{match.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{formatDate(match.date)}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        match.status === "in-progress" ? "outline" : "default"
                      }
                    >
                      {match.status === "in-progress"
                        ? "In Progress"
                        : match.status === "cancelled"
                          ? "Cancelled"
                          : "Completed"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div
                      className={`p-2 rounded-md ${match.team1.isWinner ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"}`}
                    >
                      <p className="text-xs font-medium mb-1">
                        Team 1 {match.team1.isWinner && "(Winner)"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {match.team1.players.map((player, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {player}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded-md ${match.team2.isWinner ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"}`}
                    >
                      <p className="text-xs font-medium mb-1">
                        Team 2 {match.team2.isWinner && "(Winner)"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {match.team2.players.map((player, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {player}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Map:</span>
                    <span className="font-medium">{match.map}</span>
                  </div>

                  {match.id !== recentMatches[recentMatches.length - 1].id && (
                    <Separator className="mt-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardWidgets;
