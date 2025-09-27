import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Bot, Bell, LineChart } from "lucide-react";
import Logo from "@/components/logo";

export default function Home() {
  const features = [
    {
      icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
      title: "Intuitive Task Management",
      description: "Organize your workflow with a clean, simple, and powerful kanban board.",
    },
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: "AI Task Suggester",
      description: "Leverage AI to break down complex goals into actionable sub-tasks.",
    },
    {
      icon: <Bell className="h-8 w-8 text-primary" />,
      title: "Deadline Notifications",
      description: "Stay on track with smart alerts for approaching and overdue tasks.",
    },
    {
      icon: <LineChart className="h-8 w-8 text-primary" />,
      title: "Progress Overview",
      description: "Visualize your team's progress with insightful charts and summaries.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">Nestnic TaskFlow</h1>
        </div>
        <Button asChild>
          <Link href="/dashboard">Get Started</Link>
        </Button>
      </header>

      <main className="flex-1">
        <section className="relative py-20 md:py-32 bg-background">
          <div
            aria-hidden="true"
            className="absolute inset-0 top-0 h-full w-full bg-primary/5 [mask-image:radial-gradient(300px_at_center,white,transparent)]"
          />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-headline">
              Streamline Your Workflow
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
              Nestnic TaskFlow helps you manage projects, collaborate with your team, and achieve your goals faster with AI-powered assistance.
            </p>
            <div className="mt-10">
              <Button asChild size="lg">
                <Link href="/dashboard">Start Your First Project</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24 bg-secondary/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold tracking-tight font-headline">Powerful Features for Peak Productivity</h3>
              <p className="mt-4 text-lg text-muted-foreground">Everything you need to move your projects forward.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Nestnic TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
