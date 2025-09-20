"use client";

import React, { useState, useEffect, useRef, useActionState } from "react";
import { askQuestionAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InteractiveDocumentQAOutput } from "@/ai/flows/interactive-document-qa";
import { Badge } from "./ui/badge";

interface InteractiveQAProps {
  documentText: string;
}

type QAPair = {
  question: string;
  answer: InteractiveDocumentQAOutput;
};

const initialState: { result: InteractiveDocumentQAOutput | null; error: string | null } = {
  result: null,
  error: null,
};

export function InteractiveQA({ documentText }: InteractiveQAProps) {
  const { language, t } = useLanguage();
  const [history, setHistory] = useState<QAPair[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string>("");
  const [formState, formAction, isPending] = useActionState(askQuestionAction, initialState);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (formState.error) {
      toast({
        variant: "destructive",
        title: t.toast_qa_failed_title,
        description: formState.error,
      });
      setPendingQuestion(""); // Clear pending question on error
    }
    if (formState.result && pendingQuestion) {
      setHistory(prev => [
        ...prev,
        { question: pendingQuestion, answer: formState.result! }
      ]);
      setPendingQuestion(""); // Clear pending question on success
      formRef.current?.reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState]);
  
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [history, isPending]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const question = formData.get('question') as string;
    if (question && question.length >= 5) {
        setPendingQuestion(question);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{t.qa_title}</CardTitle>
        <CardDescription>{t.qa_description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col h-[60vh] max-h-[700px]">
        <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {history.length === 0 && !isPending && (
                <div className="text-center text-muted-foreground py-10">
                    <p>{t.qa_placeholder}</p>
                </div>
            )}
            {history.map((qa, index) => (
              <React.Fragment key={index}>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[75%]">
                    <p>{qa.question}</p>
                  </div>
                  <User className="h-8 w-8 text-muted-foreground flex-shrink-0"/>
                </div>
                <div className="flex items-start gap-3">
                  <Bot className="h-8 w-8 text-primary flex-shrink-0"/>
                  <div className="bg-muted p-3 rounded-lg max-w-[75%] space-y-3">
                    <p className="text-sm">{qa.answer.answer}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{t.qa_confidence_label}: <Badge variant="outline">{Math.round(qa.answer.confidence * 100)}%</Badge></span>
                    </div>
                    {qa.answer.clauseReferences.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">{t.qa_clauses_label}:</p>
                        <div className="flex flex-wrap gap-1">
                        {qa.answer.clauseReferences.map((ref, i) => <Badge key={i} variant="secondary">{ref}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
             {isPending && pendingQuestion && (
                <>
                    <div className="flex items-start gap-3 justify-end">
                        <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[75%]">
                            <p>{pendingQuestion}</p>
                        </div>
                        <User className="h-8 w-8 text-muted-foreground flex-shrink-0"/>
                    </div>
                    <div className="flex items-start gap-3">
                        <Bot className="h-8 w-8 text-muted-foreground flex-shrink-0"/>
                        <div className="bg-muted p-3 rounded-lg max-w-[75%]">
                            <Loader2 className="h-5 w-5 animate-spin text-primary"/>
                        </div>
                    </div>
                </>
            )}
          </div>
        </ScrollArea>
        <form
          ref={formRef}
          action={formAction}
          className="flex items-center gap-2 mt-4 pt-4 border-t"
          onSubmit={handleFormSubmit}
        >
          <input type="hidden" name="documentText" value={documentText} />
          <input type="hidden" name="language" value={language} />
          <Input
            name="question"
            placeholder={t.qa_input_placeholder}
            disabled={isPending}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isPending}>
             {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
