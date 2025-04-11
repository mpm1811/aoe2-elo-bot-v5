import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trophy, TrendingUp, Users } from "lucide-react";
import DashboardWidgets from "./Dashboard/DashboardWidgets";
import MatchCreationModal from "./Matches/MatchCreationModal";

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    // This would typically use your Supabase client to check session
    const checkAuth = async () => {
      try {
        // Placeholder for actual auth check
        // const { data: { session } } = await supabase.auth.getSession();
        // setIsAuthenticated(!!session);

        // For demo purposes, setting as authenticated
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleStartMatch = () => {
    setIsMatchModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">AoE2 Team Balancer</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="/" className="font-medium text-primary">
              Dashboard
            </a>
            <a
              href="/players"
              className="font-medium text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                navigate("/players");
              }}
            >
              Players
            </a>
            <a
              href="/matches"
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              Matches
            </a>
            <a
              href="/config"
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              Config
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              <span>Profile</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Welcome to your Age of Empires 2 Team Balancer dashboard.
          </p>
        </div>

        {/* Dashboard Widgets */}
        <DashboardWidgets />

        {/* Start New Match Button */}
        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className="gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={handleStartMatch}
          >
            <PlusCircle className="h-5 w-5" />
            Start New Match
          </Button>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">128</div>
                <Trophy className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">24</div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Highest ELO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">1850</div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Match Creation Modal */}
      {isMatchModalOpen && (
        <MatchCreationModal
          open={isMatchModalOpen}
          onOpenChange={(open) => setIsMatchModalOpen(open)}
          onMatchCreated={() => console.log("Match created successfully")}
        />
      )}
    </div>
  );
};

export default Home;
