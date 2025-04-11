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
  getPlayerById,
  createPlayer,
  updatePlayer,
  Player,
} from "@/services/playerService";

// Form schema
const playerSchema = z.object({
  handle: z.string().min(2, "Handle must be at least 2 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  elo: z
    .string()
    .refine((val) => !isNaN(parseInt(val)), {
      message: "ELO must be a number",
    })
    .transform((val) => parseInt(val)),
  avatarUrl: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

const PlayerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== "new";
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      handle: "",
      firstName: "",
      lastName: "",
      elo: "1000",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    const fetchPlayer = async () => {
      if (isEditMode && id) {
        setIsLoading(true);
        try {
          const player = await getPlayerById(id);
          if (player) {
            reset({
              handle: player.handle,
              firstName: player.firstName,
              lastName: player.lastName,
              elo: player.elo.toString(),
              avatarUrl: player.avatarUrl || "",
            });
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred fetching the player",
          );
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPlayer();
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: PlayerFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isEditMode && id) {
        await updatePlayer(id, {
          handle: data.handle,
          firstName: data.firstName,
          lastName: data.lastName,
          elo: data.elo,
          avatarUrl: data.avatarUrl || undefined,
        });
      } else {
        await createPlayer({
          handle: data.handle,
          firstName: data.firstName,
          lastName: data.lastName,
          elo: data.elo,
          avatarUrl: data.avatarUrl || undefined,
        });
      }
      navigate("/players");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `An error occurred ${isEditMode ? "updating" : "creating"} the player`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2"
        onClick={() => navigate("/players")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Players
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Player" : "Add New Player"}</CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update player information"
              : "Enter details to add a new player"}
          </CardDescription>
        </CardHeader>

        {error && (
          <Alert variant="destructive" className="mx-6 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handle">Handle/Username</Label>
              <Input
                id="handle"
                placeholder="e.g. TheViper"
                {...register("handle")}
              />
              {errors.handle && (
                <p className="text-sm text-destructive">
                  {errors.handle.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="e.g. John"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Doe"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="elo">ELO Rating</Label>
              <Input
                id="elo"
                type="number"
                placeholder="e.g. 1000"
                {...register("elo")}
              />
              {errors.elo && (
                <p className="text-sm text-destructive">{errors.elo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">
                Avatar URL (Optional - leave blank for auto-generated avatar)
              </Label>
              <Input
                id="avatarUrl"
                placeholder="https://example.com/avatar.png"
                {...register("avatarUrl")}
              />
              {errors.avatarUrl && (
                <p className="text-sm text-destructive">
                  {errors.avatarUrl.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/players")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Player"
                  : "Create Player"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default PlayerForm;
