// Fired after every save of a website draft (components/editor/DraftEditor), so every view that
// shows the same draft (chat doc blocks, Research "Draft it", Going out soon) shows the saved text.
export const DRAFT_SAVED_EVENT = "alphaa:draft-saved"
export type DraftSavedDetail = { draftId: string; title: string; markdown: string; status: string }
