import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Pencil, XCircle, AlertCircle } from "lucide-react";
import { getMatches, Match, cancelMatch } from "@/services/matchService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MatchList: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [matchToCancel, setMatchToCancel] = useState<Match | null>(null);
  const navigate = useNavigate();

  const fetchMatches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMatches();
      setMatches(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred fetching matches",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleCreateMatch = () => {
    navigate("/matches/new");
  };

  const handleEditMatch = (id: string) => {
    navigate(`/matches/edit/${id}`);
  };

  const handleCancelClick = (match: Match) => {
    setMatchToCancel(match);
  };

  const confirmCancel = async () => {
    if (!matchToCancel?.id) return;

    try {
      await cancelMatch(matchToCancel.id);
      // Update the local state to reflect the cancellation
      setMatches(
        matches.map((m) =>
          m.id === matchToCancel.id ? { ...m, status: "cancelled" } : m,
        ),
      );
      setMatchToCancel(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred cancelling the match",
      );
    }
  };

  const cancelCancellation = () => {
    setMatchToCancel(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatTeamPlayers = (players: any[]) => {
    return players.map((player) => player.handle).join(", ");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Matches</h1>
        <Button onClick={handleCreateMatch} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Match
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Match List</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No matches found. Create your first match to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Map</TableHead>
                  <TableHead>Team 1</TableHead>
                  <TableHead>Team 2</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      {format(new Date(match.matchDate), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{match.map || "N/A"}</TableCell>
                    <TableCell>
                      {formatTeamPlayers(match.team1Players)}
                    </TableCell>
                    <TableCell>
                      {formatTeamPlayers(match.team2Players)}
                    </TableCell>
                    <TableCell>
                      {match.status === "completed"
                        ? `${match.team1Score} - ${match.team2Score}`
                        : "--"}
                    </TableCell>
                    <TableCell>{getStatusBadge(match.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {match.status !== "cancelled" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditMatch(match.id!)}
                              disabled={match.status === "cancelled"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {match.status === "scheduled" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelClick(match)}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!matchToCancel} onOpenChange={cancelCancellation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the match as cancelled. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground"
            >
              Yes, cancel match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MatchList;
