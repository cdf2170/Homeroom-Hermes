import React, { useState } from 'react';
import { Inbox, CheckCircle2, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface WorkItem {
  id: string;
  agentName: string;
  agentInitial: string;
  agentColor: string;
  approvalRate: number;
  taskTitle: string;
  input: string;
  output: string;
  completedAt: Date;
  status: 'awaiting' | 'approved' | 'sent-back';
  feedback?: string;
  isCode?: boolean;
}

const INITIAL_ITEMS: WorkItem[] = [
  {
    id: '1',
    agentName: 'Scout',
    agentInitial: 'S',
    agentColor: 'hsl(210, 60%, 50%)',
    approvalRate: 87,
    taskTitle: 'Summarize Q2 marketing report',
    input: 'Read the attached Q2 marketing report and produce a 3-paragraph executive summary.',
    output: `The Q2 marketing campaign achieved a 23% increase in qualified leads compared to Q1, driven primarily by the new content strategy targeting mid-market SaaS buyers. Email open rates improved to 34% after subject-line A/B testing was introduced in April.\n\nPaid acquisition costs decreased by 11% due to better audience segmentation on LinkedIn and Google Ads. The team successfully launched two webinar series that generated 450 registrations combined, with a 62% attendance rate.\n\nKey risks include over-reliance on a single channel (LinkedIn accounts for 48% of pipeline) and the upcoming privacy changes in Chrome that may impact retargeting effectiveness in Q3.`,
    completedAt: new Date(Date.now() - 35 * 60 * 1000),
    status: 'awaiting',
  },
  {
    id: '2',
    agentName: 'Pepper',
    agentInitial: 'P',
    agentColor: 'hsl(340, 60%, 50%)',
    approvalRate: 94,
    taskTitle: 'Draft onboarding email sequence',
    input: 'Write a 3-email welcome sequence for new trial users.',
    output: `Email 1 — Welcome & Quick Win (Day 0)\nSubject: You're in! Here's the fastest way to see results.\n\nHey {{first_name}},\n\nWelcome aboard. Most people get their first win in under 5 minutes — here's how...\n\nEmail 2 — Feature Spotlight (Day 2)\nSubject: The one feature 80% of power users swear by.\n\nEmail 3 — Social Proof + CTA (Day 5)\nSubject: "This saved us 6 hours a week" — here's what they did.`,
    completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    status: 'approved',
    feedback: 'Great tone — ship it as-is.',
  },
  {
    id: '3',
    agentName: 'Research Helper',
    agentInitial: 'R',
    agentColor: 'hsl(160, 50%, 40%)',
    approvalRate: 72,
    taskTitle: 'Compare auth providers for the new project',
    input: 'Research and compare Clerk, Auth0, and Supabase Auth for a B2B SaaS product.',
    output: `## Auth Provider Comparison\n\n| Feature | Clerk | Auth0 | Supabase Auth |\n|---------|-------|-------|---------------|\n| Pricing | Free to 10k MAU | Free to 7.5k MAU | Free tier available |\n| SSO | Yes (paid) | Yes (paid) | Community |\n| React SDK | Excellent | Good | Good |\n\nRecommendation: Clerk for developer experience, Auth0 for enterprise features.`,
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'sent-back',
    isCode: true,
    feedback: 'Missing latency benchmarks and self-hosted options. Please add a section on Keycloak as well.',
  },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const StatusBadge = ({ status }: { status: WorkItem['status'] }) => {
  const config = {
    awaiting: { label: 'Awaiting Review', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    approved: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
    'sent-back': { label: 'Sent Back', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  };
  const c = config[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${c.className}`}>{c.label}</span>;
};

const DoneWorkPage: React.FC = () => {
  const [items, setItems] = useState<WorkItem[]>(INITIAL_ITEMS);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const reviewItem = items.find((i) => i.id === reviewId);

  const counts = {
    awaiting: items.filter((i) => i.status === 'awaiting').length,
    approved: items.filter((i) => i.status === 'approved').length,
    sentBack: items.filter((i) => i.status === 'sent-back').length,
  };

  const handleApprove = () => {
    if (!reviewId) return;
    setItems((prev) => prev.map((i) => (i.id === reviewId ? { ...i, status: 'approved' as const, feedback: feedback || i.feedback } : i)));
    setReviewId(null);
    setFeedback('');
    toast.success('Work approved — nice job, team.');
  };

  const handleSendBack = () => {
    if (!reviewId || !feedback.trim()) {
      toast.error('Add some feedback so the agent knows what to improve.');
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === reviewId ? { ...i, status: 'sent-back' as const, feedback } : i)));
    setReviewId(null);
    setFeedback('');
    toast('Sent back with your notes. A new run will be created.');
  };

  const openReview = (id: string) => {
    const item = items.find((i) => i.id === id);
    setFeedback(item?.feedback || '');
    setReviewId(id);
  };

  const renderCards = (filtered: WorkItem[]) => {
    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">All clear — nothing on your desk right now.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Your agents are working on it.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-start gap-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5"
              style={{ backgroundColor: item.agentColor }}
            >
              {item.agentInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">{item.agentName}</span>
                <StatusBadge status={item.status} />
                <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{timeAgo(item.completedAt)}</span>
              </div>
              <p className="text-sm font-medium text-foreground/90 mb-1">{item.taskTitle}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.output.slice(0, 180)}…</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 mt-1" onClick={() => openReview(item.id)}>
              Review
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Inbox className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Done Work</h1>
        </div>
        <p className="text-sm text-muted-foreground">Your team's completed tasks, waiting for your verdict.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {counts.awaiting} awaiting review · {counts.approved} approved · {counts.sentBack} sent back
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="awaiting">
        <TabsList>
          <TabsTrigger value="awaiting" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Awaiting Review
            {counts.awaiting > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">{counts.awaiting}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="sent-back" className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Sent Back
          </TabsTrigger>
        </TabsList>

        <TabsContent value="awaiting" className="mt-4">{renderCards(items.filter((i) => i.status === 'awaiting'))}</TabsContent>
        <TabsContent value="approved" className="mt-4">{renderCards(items.filter((i) => i.status === 'approved'))}</TabsContent>
        <TabsContent value="sent-back" className="mt-4">{renderCards(items.filter((i) => i.status === 'sent-back'))}</TabsContent>
      </Tabs>

      {/* Review Sheet */}
      <Sheet open={!!reviewId} onOpenChange={(open) => { if (!open) { setReviewId(null); setFeedback(''); } }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {reviewItem && (
            <div className="space-y-6 pt-2">
              <SheetHeader className="pb-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: reviewItem.agentColor }}
                  >
                    {reviewItem.agentInitial}
                  </div>
                  <div>
                    <SheetTitle className="text-base">{reviewItem.agentName}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{reviewItem.approvalRate}% approval rate</p>
                  </div>
                </div>
              </SheetHeader>

              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">Task</p>
                <p className="text-sm text-foreground font-medium">{reviewItem.taskTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">{reviewItem.input}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Output</p>
                <div className={`rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap ${reviewItem.isCode ? 'font-mono text-xs' : ''}`}>
                  {reviewItem.output}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Your feedback</p>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What should they do differently, or what worked well?"
                  className="min-h-[80px] text-sm"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleApprove} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="outline" onClick={handleSendBack} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-1" /> Send Back
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/60 text-center">
                {reviewItem.agentName} will receive your notes and try again.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DoneWorkPage;
