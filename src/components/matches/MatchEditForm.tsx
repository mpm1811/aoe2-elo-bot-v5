import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import {
  getMatchById,
  updateMatchResult,
  createMatch,
  Match,
} from "@/services/matchService";
import { getPlayers, Player } from "@/services/playerService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

// Form schema for match results
const matchResultSchema = z.object({
  team1Score: z
    .string()
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Team 1 score must be a number",
    })
    .transform((val) => parseInt(val)),
  team2Score: z
    .string()
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Team 2 score must be a number",
    })
    .transform((val) => parseInt(val)),
});

// Form schema for creating a match
const createMatchSchema = z.object({
  matchDate: z.string().min(1, { message: "Match date is required" }),
  map: z.string().optional(),
  notes: z.string().optional(),
  team1Player1: z
    .string()
    .min(1, { message: "Player 1 for Team 1 is required" }),
  team1Player2: z
    .string()
    .min(1, { message: "Player 2 for Team 1 is required" }),
  team2Player1: z
    .string()
    .min(1, { message: "Player 1 for Team 2 is required" }),
  team2Player2: z
    .string()
    .min(1, { message: "Player 2 for Team 2 is required" }),
});

type MatchResultFormValues = z.infer<typeof matchResultSchema>;
type CreateMatchFormValues = z.infer<typeof createMatchSchema>;

const MatchEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(id === "new");

  // Form for updating match results
  const {
    register,
    handleSubmit: handleSubmitResult,
    reset: resetResult,
    formState: { errors },
  } = useForm<MatchResultFormValues>({
    resolver: zodResolver(matchResultSchema),
    defaultValues: {
      team1Score: 0,
      team2Score: 0,
    },
  });

  // Form for creating a new match
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    control,
  } = useForm<CreateMatchFormValues>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: {
      matchDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      map: "",
      notes: "",
      team1Player1: "",
      team1Player2: "",
      team2Player1: "",
      team2Player2: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch players for the create form
        const playersData = await getPlayers();
        setPlayers(playersData);

        // If editing an existing match, fetch match data
        if (id && id !== "new") {
          const matchData = await getMatchById(id);
          if (matchData) {
            setMatch(matchData);
            resetResult({
              team1Score: matchData.team1Score !== undefined ? matchData.team1Score : 0,
              team2Score: matchData.team2Score !== undefined ? matchData.team2Score : 0,
            });
          }
        } else {
          setIsCreating(true);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred fetching data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, resetResult]);

  const onSubmitResult = async (data: MatchResultFormValues) => {
    if (!id || id === "new" || !match) return;

    setIsLoading(true);
    setError(null);

    try {
      await updateMatchResult(id, data.team1Score, data.team2Score);
      navigate("/matches");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred updating the match result",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitCreate = async (data: CreateMatchFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      // Find the selected players from the players array
      const team1Player1Data = players.find((p) => p.id === data.team1Player1);
      const team1Player2Data = players.find((p) => p.id === data.team1Player2);
      const team2Player1Data = players.find((p) => p.id === data.team2Player1);
      const team2Player2Data = players.find((p) => p.id === data.team2Player2);

      if (
        !team1Player1Data ||
        !team1Player2Data ||
        !team2Player1Data ||
        !team2Player2Data
      ) {
        throw new Error("One or more selected players could not be found");
      }

      // Create the match object
      const newMatch: Omit<Match, "id"> = {
        matchDate: data.matchDate,
        team1Players: [team1Player1Data, team1Player2Data],
        team2Players: [team2Player1Data, team2Player2Data],
        status: "scheduled",
        map: data.map,
        notes: data.notes,
      };

      await createMatch(newMatch);
      navigate("/matches");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred creating the match",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTeamPlayers = (players: any[]) => {
    return players?.map((player) => player.handle).join(", ") || "";
  };

  if (isLoading && !match) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading match details...</p>
        </div>
      </div>
    );
  }

  // Render create match form
  if (isCreating) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate("/matches")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Matches
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Match</CardTitle>
            <CardDescription>
              Fill in the details to create a new match
            </CardDescription>
          </CardHeader>

          {error && (
            <Alert variant="destructive" className="mx-6 mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <CardContent>
            <form
              onSubmit={handleSubmitCreate(onSubmitCreate)}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="matchDate">Match Date and Time</Label>
                <Input
                  id="matchDate"
                  type="datetime-local"
                  {...registerCreate("matchDate")}
                />
                {createErrors.matchDate && (
                  <p className="text-sm text-destructive">
                    {createErrors.matchDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="map">Map</Label>
                <Input
                  id="map"
                  placeholder="e.g., Arabia, Black Forest"
                  {...registerCreate("map")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Team 1</h3>

                  <div className="space-y-2">
                    <Label htmlFor="team1Player1">Player 1</Label>
                    <Select
                      onValueChange={(value) => {
                        const event = {
                          target: { name: "team1Player1", value },
                        };
                        registerCreate("team1Player1").onChange(event);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id || ""}>
                            {player.handle} ({player.firstName}{" "}
                            {player.lastName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createErrors.team1Player1 && (
                      <p className="text-sm text-destructive">
                        {createErrors.team1Player1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team1Player2">Player 2</Label>
                    <Select
                      onValueChange={(value) => {
                        const event = {
                          target: { name: "team1Player2", value },
                        };
                        registerCreate("team1Player2").onChange(event);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id || ""}>
                            {player.handle} ({player.firstName}{" "}
                            {player.lastName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createErrors.team1Player2 && (
                      <p className="text-sm text-destructive">
                        {createErrors.team1Player2.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Team 2</h3>

                  <div className="space-y-2">
                    <Label htmlFor="team2Player1">Player 1</Label>
                    <Select
                      onValueChange={(value) => {
                        const event = {
                          target: { name: "team2Player1", value },
                        };
                        registerCreate("team2Player1").onChange(event);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id || ""}>
                            {player.handle} ({player.firstName}{" "}
                            {player.lastName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createErrors.team2Player1 && (
                      <p className="text-sm text-destructive">
                        {createErrors.team2Player1.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team2Player2">Player 2</Label>
                    <Select
                      onValueChange={(value) => {
                        const event = {
                          target: { name: "team2Player2", value },
                        };
                        registerCreate("team2Player2").onChange(event);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id || ""}>
                            {player.handle} ({player.firstName}{" "}
                            {player.lastName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {createErrors.team2Player2 && (
                      <p className="text-sm text-destructive">
                        {createErrors.team2Player2.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about the match"
                  {...registerCreate("notes")}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/matches")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Match"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate("/matches")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Matches
        </Button>

        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Match not found. Please select a valid match."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (match.status === "cancelled") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 flex items-center gap-2"
          onClick={() => navigate("/matches")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Matches
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Match Cancelled</CardTitle>
            <CardDescription>
              This match has been cancelled and cannot be edited.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/matches")} className="w-full">
              Return to Match List
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={() => navigate("/matches")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Matches
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update Match Result</CardTitle>
          <CardDescription>
            Enter the final scores for this match
          </CardDescription>
        </CardHeader>

        {error && (
          <Alert variant="destructive" className="mx-6 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team 1</Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  {formatTeamPlayers(match.team1Players)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Team 2</Label>
                <div className="p-3 border rounded-md bg-muted/50">
                  {formatTeamPlayers(match.team2Players)}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitResult(onSubmitResult)}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team1Score">Team 1 Score</Label>
                  <Input
                    id="team1Score"
                    type="number"
                    min="0"
                    {...register("team1Score")}
                  />
                  {errors.team1Score && (
                    <p className="text-sm text-destructive">
                      {errors.team1Score.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team2Score">Team 2 Score</Label>
                  <Input
                    id="team2Score"
                    type="number"
                    min="0"
                    {...register("team2Score")}
                  />
                  {errors.team2Score && (
                    <p className="text-sm text-destructive">
                      {errors.team2Score.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/matches")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Result"}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchEditForm;
