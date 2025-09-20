import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";
import { Terminal, Lightbulb, ShieldAlert } from "lucide-react";
import type { RegulatoryAlertSummaryOutput } from "@/ai/flows/regulatory-alert-summaries";

interface RegulatoryAlertsProps {
  alerts: RegulatoryAlertSummaryOutput;
}

export function RegulatoryAlerts({ alerts }: RegulatoryAlertsProps) {
  const { t } = useLanguage();

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline">{t.alerts_title}</CardTitle>
            <CardDescription>{t.alerts_description} {Math.round(alerts.confidenceScore * 100)}%</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle className="font-headline">{t.alerts_summary_title}</AlertTitle>
                <AlertDescription className="prose prose-sm prose-p:text-foreground/90">
                {alerts.summary}
                </AlertDescription>
            </Alert>
            <Alert variant="default" className="border-accent text-accent-foreground [&>svg]:text-accent">
                <Lightbulb className="h-4 w-4" />
                <AlertTitle className="font-headline">{t.alerts_next_steps_title}</AlertTitle>
                <AlertDescription className="prose prose-sm prose-p:text-accent-foreground/90">
                {alerts.actionableNextSteps}
                </AlertDescription>
            </Alert>
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle className="font-headline">{t.alerts_disclaimer_title}</AlertTitle>
                <AlertDescription>
                {t.alerts_disclaimer_text}
                </AlertDescription>
            </Alert>
        </CardContent>
    </Card>
  );
}
