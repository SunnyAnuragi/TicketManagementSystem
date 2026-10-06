"use client";

import { useEffect, useRef, useState } from "react";

type Comment = {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  created_at: string;
  user_name: string;
  user_email: string;
};

type TicketConversationProps = {
  comments: Comment[];
  currentUserId: number | null;
  loading: boolean;
  error: string;
  addingComment: boolean;
  addCommentError: string;
  onAddComment: (message: string) => Promise<boolean>;
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function TicketConversation({
  comments,
  currentUserId,
  loading,
  error,
  addingComment,
  addCommentError,
  onAddComment,
}: TicketConversationProps) {
  const [message, setMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [comments]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim() || addingComment) {
      return;
    }

    const success = await onAddComment(message.trim());

    if (success) {
      setMessage("");
    }
  };

  return (
    <section className="mt-10">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Conversation</h2>

        <p className="mt-1 text-sm text-slate-500">
          Communicate with the support team about this ticket.
        </p>
      </div>

      {/* Conversation Container */}
      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Messages */}
        <div className="max-h-[520px] min-h-[240px] overflow-y-auto px-5 py-6 sm:px-8">
          {loading && (
            <div className="flex min-h-[200px] items-center justify-center">
              <p className="text-sm text-slate-400">Loading conversation...</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && comments.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                ...
              </div>

              <p className="mt-4 text-sm font-medium text-slate-700">
                No messages yet
              </p>

              <p className="mt-1 max-w-sm text-sm text-slate-400">
                Start the conversation with the support team.
              </p>
            </div>
          )}

          {!loading && !error && comments.length > 0 && (
            <div className="space-y-6">
              {comments.map((comment) => {
                const isMine =
                  currentUserId !== null && comment.user_id === currentUserId;

                return (
                  <div
                    key={comment.id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[85%] items-end gap-2 sm:max-w-[70%] ${
                        isMine ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-700">
                        {getInitials(comment.user_name)}
                      </div>

                      {/* Message */}
                      <div
                        className={`min-w-0 ${
                          isMine ? "items-end" : "items-start"
                        } flex flex-col`}
                      >
                        {/* Sender */}
                        <div
                          className={`mb-1 flex items-center gap-2 ${
                            isMine ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span className="text-xs font-semibold text-slate-700">
                            {isMine ? "You" : comment.user_name}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            {formatTime(comment.created_at)}
                          </span>
                        </div>

                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isMine
                              ? "rounded-br-md bg-indigo-600 text-white"
                              : "rounded-bl-md bg-slate-100 text-slate-700"
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {comment.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-5">
          <form onSubmit={handleSubmit}>
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="Write a reply..."
                className="w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              <div className="flex items-center justify-between border-t border-slate-100 px-2 pt-2">
                <p className="text-xs text-slate-400">
                  Reply to this ticket conversation
                </p>

                <button
                  type="submit"
                  disabled={addingComment || !message.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingComment ? "Sending..." : "Send"}
                </button>
              </div>
            </div>

            {addCommentError && (
              <p className="mt-2 text-sm text-red-600">{addCommentError}</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
