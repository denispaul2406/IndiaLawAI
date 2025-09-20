"use client";

import React, { useState, useEffect, useActionState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeDocumentAction, type AnalysisResult } from "@/app/actions";
import { ComplianceReport } from "@/components/compliance-report";
import { RegulatoryAlerts } from "@/components/regulatory-alerts";
import { InteractiveQA } from "@/components/interactive-qa";
import { Loader2, Upload, File, X } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";

const initialState = {
  result: null,
  error: null,
};

export function AnalysisClient() {
  const { language, t } = useLanguage();
  const [documentText, setDocumentText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
  const [formState, formAction, isPending] = useActionState(analyzeDocumentAction, initialState);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formState.error) {
      toast({
        variant: "destructive",
        title: t.toast_analysis_failed_title,
        description: formState.error,
      });
    }
    if (formState.result) {
      setAnalysisResult(formState.result);
      setDocumentText(formState.result.documentText);
      toast({
        title: t.toast_analysis_complete_title,
        description: t.toast_analysis_complete_description,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setDocumentText(""); // Clear text area when file is uploaded
    } else {
      toast({
        variant: "destructive",
        title: t.toast_invalid_file_title,
        description: t.toast_invalid_file_description,
      });
    }
  };
  
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setImageDataUri("");
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const isAnalyzeDisabled = isPending || (!uploadedFile && documentText.length < 100);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{t.analysis_client_title}</CardTitle>
          <CardDescription>{t.analysis_client_description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-6">
            <input type="hidden" name="imageDataUri" value={imageDataUri} />
            <input type="hidden" name="language" value={language} />
            <div
              className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer border-input hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e.dataTransfer.files);
              }}
            >
              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-semibold text-primary">{t.analysis_client_upload_link}</span> {t.analysis_client_upload_text}
              </p>
              <p className="text-xs text-muted-foreground">PDF, PNG, JPG, or JPEG</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => handleFileChange(e.target.files)}
                disabled={isPending}
              />
            </div>

            {uploadedFile && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                    <div className="flex items-center gap-2">
                        <File className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium truncate">{uploadedFile.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveFile} disabled={isPending}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
            
            <div className="relative flex items-center">
              <Separator className="flex-1" />
              <span className="px-2 text-xs text-muted-foreground">{t.analysis_client_separator}</span>
              <Separator className="flex-1" />
            </div>

            <Textarea
              name="documentText"
              placeholder={t.analysis_client_textarea_placeholder}
              className="min-h-[200px] font-body text-sm bg-muted/30"
              value={documentText}
              onChange={(e) => {
                setDocumentText(e.target.value);
                if (uploadedFile) handleRemoveFile();
              }}
              disabled={isPending}
            />
            <Button type="submit" disabled={isAnalyzeDisabled} className="w-fit">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t.analysis_client_analyze_button}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {isPending && (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex space-x-1 border border-input rounded-lg p-1 bg-muted">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-8 w-1/3" />
             </div>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      )}

      {analysisResult && !isPending && (
        <Tabs defaultValue="compliance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compliance">{t.analysis_results_tab_compliance}</TabsTrigger>
            <TabsTrigger value="alerts">{t.analysis_results_tab_alerts}</TabsTrigger>
            <TabsTrigger value="qa">{t.analysis_results_tab_qa}</TabsTrigger>
          </TabsList>
          <TabsContent value="compliance">
            <ComplianceReport report={analysisResult.compliance} />
          </TabsContent>
          <TabsContent value="alerts">
            <RegulatoryAlerts alerts={analysisResult.summary} />
          </TabsContent>
          <TabsContent value="qa">
            <InteractiveQA documentText={analysisResult.documentText} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
