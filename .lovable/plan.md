

# Done Work Page — Manager's Review Desk

## What we're building
A new page at `/done-work` where completed agent work lands for manager review. It functions as an inbox crossed with a performance review — agents deliver outputs and the user approves or sends them back with feedback.

## Plan

### 1. Create `src/pages/DoneWorkPage.tsx`
- **Header**: "Done Work" title + subtitle + summary stats line (X awaiting · Y approved · Z sent back)
- **Three tab filters**: Awaiting Review (default, with count badge), Approved, Sent Back
- **Work cards** in a list, each showing:
  - Agent avatar circle (colored initials) + name
  - Task title, time completed (relative), truncated output preview (2-3 lines)
  - Status badge (amber/green/muted-red)
  - "Review" button opening a Sheet panel
- **Review panel** (Sheet from right):
  - Agent avatar + name + approval rate
  - Full output in a readable area (monospace for code-like, prose otherwise)
  - "Your feedback" textarea
  - Approve (green) + Send Back (outline) buttons with disclaimer text
- **Empty state**: Icon + "All clear — nothing on your desk right now."
- **Mock data**: 3 cards — Scout (awaiting), Pepper (approved), Research Helper (sent back) with realistic task names and outputs

### 2. Update `src/components/AppSidebar.tsx`
- Add `{ to: '/done-work', icon: Inbox, label: 'Done Work' }` after Activity & Trust, before Approvals
- Import `Inbox` from lucide-react

### 3. Update `src/App.tsx`
- Import `DoneWorkPage` and add route: `<Route path="/done-work" element={<AppLayout><DoneWorkPage /></AppLayout>} />`

### Technical notes
- Uses existing UI components: `Sheet`, `Tabs`, `Button`, `Badge`, `Textarea`, `Card`
- Mock data stored as local state with `useState` — approve/send-back actions update state in-place with toast notifications
- Follows the same card shadow + white background pattern used in ApprovalsPage
- `timeAgo` helper reused from the same pattern in ApprovalsPage

