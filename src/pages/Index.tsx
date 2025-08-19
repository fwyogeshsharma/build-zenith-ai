// Welcome page for new users with link to authentication

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Bot, Leaf, Users, BarChart3, FileText } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-white/20 p-4 rounded-2xl">
              <Building2 className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white">ConstructAI</h1>
          </div>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            AI-powered project management platform for real estate construction projects. 
            Streamline your entire lifecycle from concept to completion.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
              Get Started Today
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="bg-primary/20 p-3 rounded-lg w-fit">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription className="text-white/70">
                Get intelligent recommendations for optimization, risk management, and resource allocation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="bg-sustainability/20 p-3 rounded-lg w-fit">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Certification Workflows</CardTitle>
              <CardDescription className="text-white/70">
                Streamlined LEED, IGBC, BREEAM, and other green building certification processes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="bg-construction/20 p-3 rounded-lg w-fit">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription className="text-white/70">
                Real-time collaboration tools for architects, engineers, contractors, and clients.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="bg-primary/20 p-3 rounded-lg w-fit">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription className="text-white/70">
                Comprehensive dashboards for tracking progress, costs, and performance metrics.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="bg-construction/20 p-3 rounded-lg w-fit">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Document Management</CardTitle>
              <CardDescription className="text-white/70">
                Centralized storage and version control for all project documentation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="bg-sustainability/20 p-3 rounded-lg w-fit">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Project Templates</CardTitle>
              <CardDescription className="text-white/70">
                Pre-built templates for different construction types and project phases.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Construction Projects?</h2>
              <p className="text-white/80 mb-6">
                Join leading construction companies using AI to optimize their project management workflows.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-construction hover:bg-construction-dark">
                  Start Free Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
