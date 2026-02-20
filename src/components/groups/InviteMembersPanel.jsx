import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, UserCheck, Clock, XCircle, RefreshCw, Send } from "lucide-react";

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function parseEmails(raw) {
  return raw.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
}

export default function InviteMembersPanel({ group, user, onInvited }) {
  const [emailInput, setEmailInput] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: invites = [], refetch: refetchInvites } = useQuery({
    queryKey: ["groupInvites", group.id],
    queryFn: () => base44.entities.GroupInvite.filter({ group_id: group.id }),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["campusMembers", group.id],
    queryFn: () => base44.entities.GroupMember.filter({ group_id: group.id }),
  });

  const handleSendInvites = async () => {
    const emails = parseEmails(emailInput);
    const invalid = emails.filter(e => !validateEmail(e));
    if (invalid.length) { toast.error(`Invalid email(s): ${invalid.join(", ")}`); return; }
    if (!emails.length) { toast.error("Enter at least one email"); return; }

    const existingEmails = new Set([
      ...invites.filter(i => i.status !== "expired" && i.status !== "revoked").map(i => i.email),
      ...members.map(m => m.user_email),
    ]);
    const toInvite = emails.filter(e => !existingEmails.has(e));
    const duplicates = emails.filter(e => existingEmails.has(e));

    if (duplicates.length) toast.info(`Already invited/joined: ${duplicates.join(", ")}`);
    if (!toInvite.length) { toast.info("No new emails to invite"); return; }

    setSending(true);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await Promise.all(toInvite.map(email =>
      base44.entities.GroupInvite.create({
        group_id: group.id,
        email,
        invited_by: user.email,
        status: "pending",
        expires_at: expiresAt,
      })
    ));
    toast.success(`${toInvite.length} invite(s) sent!`);
    setEmailInput("");
    setSending(false);
    refetchInvites();
    onInvited?.();
  };

  const handleRevoke = async (invite) => {
    await base44.entities.GroupInvite.update(invite.id, { status: "revoked" });
    toast.success("Invite revoked");
    refetchInvites();
  };

  const handleResend = async (invite) => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await base44.entities.GroupInvite.update(invite.id, { status: "pending", expires_at: expiresAt });
    toast.success("Invite renewed!");
    refetchInvites();
  };

  const statusIcon = { pending: Clock, accepted: UserCheck, expired: XCircle, revoked: XCircle };
  const statusColor = { pending: "text-amber-400", accepted: "text-emerald-400", expired: "text-red-400", revoked: "text-red-400" };

  return (
    <div className="space-y-6">
      {/* Send invites */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Mail size={16} className="text-teal-400" />Invite by Email</h3>
        <p className="text-white/40 text-xs mb-4">Enter emails separated by commas or new lines. Members will receive an invite link.</p>
        <textarea
          value={emailInput}
          onChange={e => setEmailInput(e.target.value)}
          placeholder={"alice@example.com\nbob@example.com"}
          rows={4}
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl p-3 resize-none placeholder-white/20 focus:outline-none focus:border-teal-500"
        />
        <Button onClick={handleSendInvites} disabled={!emailInput.trim() || sending}
          className="mt-3 w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-semibold flex items-center gap-2">
          <Send size={14} />
          {sending ? "Sending…" : "Send Invites"}
        </Button>
      </div>

      {/* Invites list */}
      <div className="space-y-2">
        <h3 className="text-white/70 text-sm font-semibold uppercase tracking-wide">Sent Invites ({invites.length})</h3>
        {invites.length === 0 ? (
          <div className="text-center text-white/30 py-6 text-sm">No invites sent yet</div>
        ) : (
          invites.map(invite => {
            const Icon = statusIcon[invite.status] || Clock;
            const color = statusColor[invite.status] || "text-white/40";
            const isExpired = invite.status === "expired" || (invite.expires_at && new Date(invite.expires_at) < new Date());
            return (
              <div key={invite.id} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon size={16} className={color} />
                  <div>
                    <div className="text-white text-sm">{invite.email}</div>
                    <div className={`text-xs capitalize ${color}`}>{isExpired ? "expired" : invite.status}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(isExpired || invite.status === "pending") && invite.status !== "accepted" && (
                    <button onClick={() => handleResend(invite)} className="text-teal-400 hover:text-teal-300 p-1">
                      <RefreshCw size={14} />
                    </button>
                  )}
                  {invite.status === "pending" && (
                    <button onClick={() => handleRevoke(invite)} className="text-red-400 hover:text-red-300 p-1">
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}