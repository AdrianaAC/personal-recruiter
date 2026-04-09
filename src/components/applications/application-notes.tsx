"use client";

import { useState } from "react";

type Note = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ApplicationNotesProps = {
  applicationId: string;
  initialNotes: Note[];
};

type NoteFormState = {
  title: string;
  content: string;
};

const initialFormState: NoteFormState = {
  title: "",
  content: "",
};

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString();
}

export function ApplicationNotes({
  applicationId,
  initialNotes,
}: ApplicationNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [form, setForm] = useState<NoteFormState>(initialFormState);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NoteFormState>(initialFormState);

  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  function startEdit(note: Note) {
    setEditingNoteId(note.id);
    setEditForm({
      title: note.title ?? "",
      content: note.content,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingNoteId(null);
    setEditForm(initialFormState);
    setError(null);
  }

  async function handleCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Failed to create note.");
        return;
      }

      setNotes((prev) => [result, ...prev]);
      setForm(initialFormState);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while creating the note.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveEdit(noteId: string) {
    setIsSavingEdit(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Failed to update note.");
        return;
      }

      setNotes((prev) =>
        prev.map((note) => (note.id === noteId ? result : note)),
      );
      setEditingNoteId(null);
      setEditForm(initialFormState);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating the note.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingNoteId(noteId);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Failed to delete note.");
        return;
      }

      setNotes((prev) => prev.filter((note) => note.id !== noteId));

      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setEditForm(initialFormState);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while deleting the note.");
    } finally {
      setDeletingNoteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add Note</h2>
        <p className="mt-1 text-sm text-gray-600">
          Save thoughts, interview details, recruiter feedback, or FollowUp
          context.
        </p>

        <form onSubmit={handleCreateNote} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="note-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="note-title"
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              placeholder="e.g. Recruiter screen takeaways"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="note-content" className="text-sm font-medium">
              Content *
            </label>
            <textarea
              id="note-content"
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              className="min-h-[140px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              placeholder="Write your notes here..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Saving..." : "Add note"}
          </button>
        </form>
      </section>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Notes</h2>
            <p className="mt-1 text-sm text-gray-600">
              Keep track of everything related to this opportunity.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <h3 className="text-base font-medium">No notes yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Add your first note to start building context around this
              application.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {notes.map((note) => {
              const isEditing = editingNoteId === note.id;
              const isDeleting = deletingNoteId === note.id;

              return (
                <article
                  key={note.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor={`edit-title-${note.id}`}
                          className="text-sm font-medium"
                        >
                          Title
                        </label>
                        <input
                          id={`edit-title-${note.id}`}
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`edit-content-${note.id}`}
                          className="text-sm font-medium"
                        >
                          Content *
                        </label>
                        <textarea
                          id={`edit-content-${note.id}`}
                          value={editForm.content}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          className="min-h-[140px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                          required
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={isSavingEdit}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSavingEdit ? "Saving..." : "Save changes"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSavingEdit}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {note.title || "Untitled note"}
                          </h3>
                          <p className="mt-1 text-xs text-gray-500">
                            Created {formatDate(note.createdAt)} · Updated{" "}
                            {formatDate(note.updatedAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(note)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={isDeleting}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>

                      <div className="whitespace-pre-wrap text-sm text-gray-800">
                        {note.content}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
