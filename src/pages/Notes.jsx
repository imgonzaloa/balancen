import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";
import { useAppState } from "@/components/AppStateContext";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Notes() {
  const { user, isInitialized } = useAppState();
  const { t, lang } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    loadNotes();
  }, [user?.email]);

  const loadNotes = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const dailyNotes = await base44.entities.DailyCheckIn.filter({
        created_by: user.email,
        date: today
      });
      
      // Extract notes from DailyCheckIn or create empty array
      const existingNotes = dailyNotes?.[0]?.notes || [];
      setNotes(Array.isArray(existingNotes) ? existingNotes : []);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!noteText.trim()) {
      toast.error(lang === "es" ? "Escribe algo" : "Write something");
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const dailyCheckins = await base44.entities.DailyCheckIn.filter({
        created_by: user.email,
        date: today
      });

      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        created: new Date().toISOString()
      };

      let updatedNotes;
      if (editingNote) {
        updatedNotes = notes.map(n => n.id === editingNote.id ? { ...n, text: noteText } : n);
      } else {
        updatedNotes = [newNote, ...notes];
      }

      if (dailyCheckins.length > 0) {
        await base44.entities.DailyCheckIn.update(dailyCheckins[0].id, {
          notes: JSON.stringify(updatedNotes)
        });
      } else {
        await base44.entities.DailyCheckIn.create({
          date: today,
          completed: false,
          notes: JSON.stringify(updatedNotes)
        });
      }

      setNotes(updatedNotes);
      setNoteText("");
      setEditingNote(null);
      setShowForm(false);
      toast.success(editingNote 
        ? (lang === "es" ? "Nota actualizada" : "Note updated")
        : (lang === "es" ? "Nota guardada" : "Note saved")
      );
    } catch (err) {
      console.error("Failed to save note:", err);
      toast.error(lang === "es" ? "Error al guardar" : "Failed to save");
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const dailyCheckins = await base44.entities.DailyCheckIn.filter({
        created_by: user.email,
        date: today
      });

      const updatedNotes = notes.filter(n => n.id !== noteId);
      
      if (dailyCheckins.length > 0) {
        await base44.entities.DailyCheckIn.update(dailyCheckins[0].id, {
          notes: JSON.stringify(updatedNotes)
        });
      }

      setNotes(updatedNotes);
      toast.success(lang === "es" ? "Nota eliminada" : "Note deleted");
    } catch (err) {
      console.error("Failed to delete note:", err);
      toast.error(lang === "es" ? "Error al eliminar" : "Failed to delete");
    }
  };

  const startEdit = (note) => {
    setEditingNote(note);
    setNoteText(note.text);
    setShowForm(true);
  };

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ minHeight: '100dvh', overflowY: 'auto' }}>
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">
              {lang === "es" ? "Notas" : "Notes"}
            </h1>
            <p className="text-white/60 text-sm">
              {lang === "es" ? "Tus pensamientos del día" : "Your daily thoughts"}
            </p>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setEditingNote(null);
              setNoteText("");
            }}
            className="rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          >
            <Plus size={20} />
          </Button>
        </div>

        {/* Note Form */}
        {showForm && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={lang === "es" ? "Escribe tu nota..." : "Write your note..."}
                className="w-full bg-transparent border-none text-white placeholder-white/40 resize-none outline-none text-base"
                rows={4}
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingNote(null);
                    setNoteText("");
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white"
                >
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </Button>
                <Button
                  onClick={saveNote}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500"
                >
                  {lang === "es" ? "Guardar" : "Save"}
                </Button>
              </div>
            </div>
          )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-10 border border-purple-500/20 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-white font-bold text-lg mb-2">
              {lang === "es" ? "Sin notas todavía" : "No notes yet"}
            </h3>
            <p className="text-white/60 text-sm">
              {lang === "es" ? "Toca + para escribir tu primera nota" : "Tap + to write your first note"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white text-base leading-relaxed">{note.text}</p>
                    <p className="text-white/40 text-xs mt-2">
                      {new Date(note.created).toLocaleString(lang === "es" ? "es-ES" : "en-US", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(note)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <Edit2 size={14} className="text-white/60" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}