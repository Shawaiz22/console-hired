import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:py-24 md:py-32">
          <div className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-primary" />
            AI-Powered Career Preparation
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            See what recruiters see — before they do.
          </h1>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
            Upload your resume, paste a job description, and get honest feedback in seconds. Then
            practise the interview.
          </p>

          <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:w-auto sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/register">Get started free</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="mx-auto max-w-6xl px-4 pb-20 md:pb-28">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="transition-all hover:border-foreground/20">
              <CardHeader>
                <div className="mb-2 font-mono text-xs font-semibold text-primary">
                  01 / ANALYZE
                </div>
                <CardTitle>Resume analysis</CardTitle>
                <CardDescription>
                  Extract skills, evaluate job description match score, and get actionable
                  recommendations to pass screenings.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-all hover:border-foreground/20">
              <CardHeader>
                <div className="mb-2 font-mono text-xs font-semibold text-primary">
                  02 / INTERVIEW
                </div>
                <CardTitle>Mock interview</CardTitle>
                <CardDescription>
                  Practise role-tailored questions with real-time feedback on clarity, relevance,
                  and STAR technique.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="transition-all hover:border-foreground/20">
              <CardHeader>
                <div className="mb-2 font-mono text-xs font-semibold text-primary">
                  03 / IMPROVE
                </div>
                <CardTitle>Track progress</CardTitle>
                <CardDescription>
                  Track your scores across iterations and build confidence before talking to actual
                  hiring managers.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4">
          © {new Date().getFullYear()} console.hired() — An intelligent career preparation platform.
        </div>
      </footer>
    </div>
  );
}
