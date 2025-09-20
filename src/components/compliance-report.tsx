import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ListChecks, AlertTriangle, ShieldQuestion, Scale, Clock, ShieldCheck } from "lucide-react";
import type { ComplianceCheckOutput } from "@/ai/flows/compliance-check";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useLanguage } from "@/hooks/use-language";

interface ComplianceReportProps {
    report: ComplianceCheckOutput;
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase().replace(/\s/g, '')) {
    case 'compliant':
      return <Badge className="bg-green-600 text-base text-white hover:bg-green-700"><ListChecks className="mr-2 h-4 w-4" />Compliant</Badge>;
    case 'non-compliant':
    case 'noncompliant':
      return <Badge variant="destructive" className="text-base"><AlertTriangle className="mr-2 h-4 w-4" />Non-Compliant</Badge>;
    case 'needsreview':
      return <Badge className="bg-yellow-500 text-base text-black hover:bg-yellow-600"><ShieldQuestion className="mr-2 h-4 w-4" />Needs Review</Badge>;
    default:
       return <Badge className="bg-yellow-500 text-base text-black hover:bg-yellow-600"><ShieldQuestion className="mr-2 h-4 w-4" />{status}</Badge>;
  }
};

const ValueCard = ({ icon, title, value, unit }: { icon: React.ElementType, title: string, value: string, unit: string }) => (
    <div className="bg-card/50 p-4 rounded-lg text-center">
        <div className="flex justify-center mb-2">
            {React.createElement(icon, { className: "w-8 h-8 text-primary" })}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold font-headline">{value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></p>
    </div>
);

const ComplianceScore = ({ score, breakdown, t }: { score: number, breakdown: { category: string, score: number }[], t: any }) => (
    <div className="bg-gradient-to-r from-primary/80 to-accent/80 p-6 rounded-lg text-primary-foreground">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
                <h2 className="text-xl font-headline font-bold text-white mb-1">{t.compliance_report_score_title}</h2>
                <p className="text-6xl font-bold font-mono text-white">{score}<span className="text-2xl">/100</span></p>
                <div className="flex items-center gap-2 justify-center md:justify-start mt-2">
                    <Progress value={score} className="w-32 h-2 [&>*]:bg-white" />
                    <span className="text-xs text-white/80">{t.compliance_report_score_subtitle}</span>
                </div>
            </div>
            <div className="w-full md:w-2/3 h-48">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdown} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary-foreground) / 0.2)" />
                        <XAxis dataKey="category" stroke="hsl(var(--primary-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--primary-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                color: "hsl(var(--foreground))",
                                borderRadius: "var(--radius)",
                            }}
                            cursor={{ fill: 'hsl(var(--primary-foreground) / 0.1)' }}
                        />
                        <Bar dataKey="score" fill="hsl(var(--primary-foreground))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);


export function ComplianceReport({ report }: ComplianceReportProps) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-6">
        <ComplianceScore score={report.indiaLawScore} breakdown={report.scoreBreakdown} t={t} />

        <Card>
             <CardHeader>
                <CardTitle className="font-headline flex flex-wrap items-center justify-between gap-2">
                    <span>{t.compliance_report_analysis_details_title}</span>
                    {getStatusBadge(report.complianceStatus)}
                </CardTitle>
                <CardDescription>{t.compliance_report_analysis_details_description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-4">
                    <h3 className="font-semibold font-headline text-lg">{t.compliance_report_justification_title}</h3>
                    <p className="text-base text-foreground/90">{report.categoryJustification.headline}</p>
                    <ul className="space-y-3">
                        {report.categoryJustification.bulletPoints.map((point, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="grid gap-2">
                    <h3 className="font-semibold font-headline">{t.compliance_report_regulations_title}</h3>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                        {report.relevantRegulations.map((reg, index) => (
                            <li key={index}>{reg}</li>
                        ))}
                    </ul>
                </div>
                 <div className="grid gap-2">
                    <h3 className="font-semibold font-headline">{t.compliance_report_confidence_title}</h3>
                    <div className="flex items-center gap-4">
                        <Progress value={report.confidenceScore * 100} className="w-full [&>*]:bg-primary" />
                        <span className="font-mono text-lg font-semibold text-foreground">{Math.round(report.confidenceScore * 100)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">{t.compliance_report_value_title}</CardTitle>
                <CardDescription>{t.compliance_report_value_description}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ValueCard icon={Scale} title={t.value_card_costs_avoided} value="~₹50k" unit="- 2L" />
                <ValueCard icon={Clock} title={t.value_card_time_saved} value="4-6" unit={t.value_card_time_unit} />
                <ValueCard icon={ShieldCheck} title={t.value_card_risk_reduction} value="~85%" unit={t.value_card_risk_unit} />
            </CardContent>
        </Card>
    </div>
  );
}
