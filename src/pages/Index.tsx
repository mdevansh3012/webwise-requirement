import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Users, ClipboardList, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                RequireFlow
              </span>
            </div>
            <Link to="/admin">
              <Button variant="outline" className="shadow-soft hover:shadow-elegant transition-all duration-300">
                Admin Panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Streamline Your Requirements Gathering
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create beautiful, interactive questionnaires for your clients. Collect requirements 
              efficiently with our elegant form builder and data collection platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/admin">
                <Button size="lg" className="shadow-elegant hover:shadow-card transition-all duration-300">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="shadow-soft">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg text-muted-foreground">
              Powerful tools to create, manage, and analyze your requirements gathering process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 group border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Form Builder</CardTitle>
                <CardDescription>
                  Drag-and-drop interface to create custom questionnaires with multiple question types
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 group border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Client Portal</CardTitle>
                <CardDescription>
                  Personalized pages for each client with beautiful, user-friendly forms
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 group border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ClipboardList className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Smart Collection</CardTitle>
                <CardDescription>
                  Intelligent form handling with validation, progress tracking, and auto-save
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all duration-300 group border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Comprehensive insights and reporting on form responses and completion rates
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-card/30">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <ClipboardList className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">RequireFlow</span>
          </div>
          <p className="text-muted-foreground">
            Streamlining requirements gathering for modern businesses
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;