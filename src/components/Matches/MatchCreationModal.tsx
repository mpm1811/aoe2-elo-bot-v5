import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Users, Map } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Player {
  id: string;
  handle: string;
  elo: number;
}

interface Team {
  players: Player[];
  totalElo: number;
}

interface Map {
  id: string;
  name: string;
}

interface MatchCreationModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onMatchCreated?: () => void;
}

const MatchCreationModal = ({
  open = true,
  onOpenChange,
  onMatchCreated,
}: MatchCreationModalProps) => {
  const [selectedPlayers, setSelectedPlayers] = useState<(Player | null)[]>(
    Array(8).fill(null),
  );
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [maps, setMaps] = useState<Map[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [teams, setTeams] = useState<{ team1: Team; team2: Team } | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would be fetched from an API
    setAvailablePlayers([
      { id: "1", handle: "TheViper", elo: 2400 },
      { id: "2", handle: "DauT", elo: 2300 },
      { id: "3", handle: "Hera", elo: 2350 },
      { id: "4", handle: "TaToH", elo: 2250 },
      { id: "5", handle: "Liereyy", elo: 2380 },
      { id: "6", handle: "MbL", elo: 2200 },
      { id: "7", handle: "Villese", elo: 2150 },
      { id: "8", handle: "TheMax", elo: 2100 },
      { id: "9", handle: "Nicov", elo: 2050 },
      { id: "10", handle: "Vivi", elo: 2000 },
    ]);

    setMaps([
      { id: "1", name: "Arabia" },
      { id: "2", name: "Arena" },
      { id: "3", name: "Black Forest" },
      { id: "4", name: "Gold Rush" },
      { id: "5", name: "Islands" },
      { id: "6", name: "Mediterranean" },
      { id: "7", name: "Nomad" },
      { id: "8", name: "Scandinavia" },
    ]);
  }, []);

  const handlePlayerSelect = (index: number, playerId: string) => {
    const newSelectedPlayers = [...selectedPlayers];

    if (playerId === "none") {
      newSelectedPlayers[index] = null;
    } else {
      const player = availablePlayers.find((p) => p.id === playerId) || null;
      newSelectedPlayers[index] = player;
    }

    setSelectedPlayers(newSelectedPlayers);
    setTeams(null); // Reset teams when player selection changes
  };

  const handleMapSelect = (mapId: string) => {
    setSelectedMap(mapId);
  };

  const generateTeams = () => {
    // Filter out null values and get actual players
    const validPlayers = selectedPlayers.filter(
      (player) => player !== null,
    ) as Player[];

    if (validPlayers.length < 3) {
      setError("Please select at least 3 players to generate teams");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simple algorithm to balance teams (in a real app, this would be more sophisticated)
    setTimeout(() => {
      // Sort players by ELO (descending)
      const sortedPlayers = [...validPlayers].sort((a, b) => b.elo - a.elo);

      const team1: Player[] = [];
      const team2: Player[] = [];
      let team1Elo = 0;
      let team2Elo = 0;

      // Distribute players to minimize ELO difference
      sortedPlayers.forEach((player) => {
        if (team1Elo <= team2Elo) {
          team1.push(player);
          team1Elo += player.elo;
        } else {
          team2.push(player);
          team2Elo += player.elo;
        }
      });

      // Handle odd number of players
      if (Math.abs(team1.length - team2.length) > 1) {
        if (team1.length > team2.length) {
          const player = team1.pop();
          if (player) {
            team2.push(player);
            team1Elo -= player.elo;
            team2Elo += player.elo;
          }
        } else {
          const player = team2.pop();
          if (player) {
            team1.push(player);
            team2Elo -= player.elo;
            team1Elo += player.elo;
          }
        }
      }

      setTeams({
        team1: { players: team1, totalElo: team1Elo },
        team2: { players: team2, totalElo: team2Elo },
      });

      setIsLoading(false);
    }, 1000); // Simulate API delay
  };

  const startMatch = () => {
    if (!teams || !selectedMap) {
      setError("Please generate teams and select a map first");
      return;
    }

    // In a real app, this would call an API to create the match
    console.log("Creating match with:", { teams, map: selectedMap });

    // Close modal and notify parent
    if (onMatchCreated) onMatchCreated();
    if (onOpenChange) onOpenChange(false);
  };

  const getAvailablePlayersForDropdown = (index: number) => {
    return availablePlayers.filter((player) => {
      // A player is available if they're not selected in any other dropdown
      return !selectedPlayers.some(
        (p, i) => i !== index && p?.id === player.id,
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create New Match
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Select Players</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {selectedPlayers.map((player, index) => (
                <Select
                  key={index}
                  value={player?.id || ""}
                  onValueChange={(value) =>
                    handlePlayerSelect(index, value || null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Player ${index + 1}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {getAvailablePlayersForDropdown(index).map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.handle} ({player.elo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>

          {/* Map Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Select Map</h3>
            </div>

            <Select value={selectedMap} onValueChange={handleMapSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a map" />
              </SelectTrigger>
              <SelectContent>
                {maps.map((map) => (
                  <SelectItem key={map.id} value={map.id}>
                    {map.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Teams Button */}
          <div className="flex justify-center">
            <Button
              onClick={generateTeams}
              disabled={selectedPlayers.filter(Boolean).length < 3 || isLoading}
              className="w-full"
            >
              {isLoading ? "Generating..." : "Generate Balanced Teams"}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Team Display */}
          {teams && (
            <div className="space-y-4">
              <Separator />
              <h3 className="text-lg font-semibold text-center">
                Generated Teams
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Team 1 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center">Team 1</CardTitle>
                    <Badge
                      className="w-full justify-center"
                      variant="secondary"
                    >
                      Total ELO: {teams.team1.totalElo}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {teams.team1.players.map((player) => (
                        <li
                          key={player.id}
                          className="flex justify-between items-center"
                        >
                          <span>{player.handle}</span>
                          <Badge variant="outline">{player.elo}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Team 2 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-center">Team 2</CardTitle>
                    <Badge
                      className="w-full justify-center"
                      variant="secondary"
                    >
                      Total ELO: {teams.team2.totalElo}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {teams.team2.players.map((player) => (
                        <li
                          key={player.id}
                          className="flex justify-between items-center"
                        >
                          <span>{player.handle}</span>
                          <Badge variant="outline">{player.elo}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                ELO Difference:{" "}
                {Math.abs(teams.team1.totalElo - teams.team2.totalElo)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange && onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={startMatch}
            disabled={!teams || !selectedMap || isLoading}
          >
            Start Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MatchCreationModal;
