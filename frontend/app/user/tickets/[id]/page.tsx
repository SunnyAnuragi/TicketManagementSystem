"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TicketConversation from "@/components/tickets/TicketConversation";
import api from "@/lib/axios";
import type { Ticket } from "@/types/ticket";

type Comment = {
  id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  created_at: string;
  user_name: string;
  user_email: string;
};

type Attachment = {
  id: number;
  ticket_id: number;
  uploaded_by: number;
  file_name: string;
  file_url: string;
  public_id: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params.id;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- Ticket ---------------- */

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- Comments ---------------- */

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");

  const [addingComment, setAddingComment] = useState(false);
  const [addCommentError, setAddCommentError] = useState("");

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  /* ---------------- Attachments ---------------- */

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [attachmentsError, setAttachmentsError] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    number | null
  >(null);

  /* ---------------- Add Comment ---------------- */

  const handleAddComment = async (message: string): Promise<boolean> => {
    setAddCommentError("");

    try {
      setAddingComment(true);

      await api.post(`/tickets/${ticketId}/comments`, {
        message,
      });

      const response = await api.get(`/tickets/${ticketId}/comments`);

      setComments(response.data.comments);

      return true;
    } catch (error) {
      console.error(error);

      setAddCommentError("Failed to add comment");

      return false;
    } finally {
      setAddingComment(false);
    }
  };

  /* ---------------- Fetch Attachments ---------------- */

  const fetchAttachments = async () => {
    try {
      setAttachmentsLoading(true);
      setAttachmentsError("");

      const response = await api.get(`/tickets/${ticketId}/attachments`);

      setAttachments(response.data.attachments);
    } catch (error) {
      console.error(error);

      setAttachmentsError("Failed to load attachments");
    } finally {
      setAttachmentsLoading(false);
    }
  };

  /* ---------------- File Selection ---------------- */

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    setUploadError("");

    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const remainingSlots = MAX_ATTACHMENTS - attachments.length;

    if (files.length > remainingSlots) {
      setUploadError(
        `You can upload only ${remainingSlots} more image${
          remainingSlots === 1 ? "" : "s"
        }.`,
      );

      event.target.value = "";

      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setUploadError(
          `${file.name}: Only JPG, JPEG, PNG, and WEBP images are allowed.`,
        );

        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`${file.name}: Image size must be less than 5 MB.`);

        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((previousFiles) => [...previousFiles, ...validFiles]);
    }

    event.target.value = "";
  };

  /* ---------------- Remove Selected File ---------------- */

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((previousFiles) =>
      previousFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  /* ---------------- Upload Attachments ---------------- */

  const handleUploadAttachments = async () => {
    if (selectedFiles.length === 0) {
      setUploadError("Please select at least one image.");
      return;
    }

    if (ticket?.status === "CLOSED") {
      setUploadError("Closed tickets cannot be modified.");

      return;
    }

    if (attachments.length + selectedFiles.length > MAX_ATTACHMENTS) {
      setUploadError(`A ticket can have maximum ${MAX_ATTACHMENTS} images.`);

      return;
    }

    try {
      setUploadingAttachments(true);
      setUploadError("");

      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      await api.post(`/tickets/${ticketId}/attachments`, formData);

      setSelectedFiles([]);

      await fetchAttachments();
    } catch (error) {
      console.error(error);

      setUploadError("Failed to upload images.");
    } finally {
      setUploadingAttachments(false);
    }
  };

  /* ---------------- Delete Attachment ---------------- */

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (ticket?.status === "CLOSED") {
      return;
    }

    try {
      setDeletingAttachmentId(attachmentId);

      await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);

      setAttachments((previousAttachments) =>
        previousAttachments.filter(
          (attachment) => attachment.id !== attachmentId,
        ),
      );
    } catch (error) {
      console.error(error);

      setAttachmentsError("Failed to delete attachment.");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  /* ---------------- Initial Ticket Data ---------------- */

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me");

        setCurrentUserId(response.data.id);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/tickets/${ticketId}`);

        setTicket(response.data.ticket);
      } catch (error) {
        console.error(error);

        setError("Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        setCommentsError("");

        const response = await api.get(`/tickets/${ticketId}/comments`);

        setComments(response.data.comments);
      } catch (error) {
        console.error(error);

        setCommentsError("Failed to load comments");
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchCurrentUser();
    fetchTicket();
    fetchComments();
  }, [ticketId]);

  /* ---------------- Attachment Data ---------------- */

  useEffect(() => {
    const loadAttachments = async () => {
      try {
        setAttachmentsLoading(true);
        setAttachmentsError("");

        const response = await api.get(`/tickets/${ticketId}/attachments`);

        setAttachments(response.data.attachments);
      } catch (error) {
        console.error(error);

        setAttachmentsError("Failed to load attachments");
      } finally {
        setAttachmentsLoading(false);
      }
    };

    loadAttachments();
  }, [ticketId]);

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-500">Loading ticket...</p>
      </div>
    );
  }

  /* ---------------- Error ---------------- */

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  /* ---------------- Ticket Not Found ---------------- */

  if (!ticket) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          Ticket not found
        </h2>

        <Link
          href="/user/tickets"
          className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Back to My Tickets
        </Link>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-5xl">
        {/* Back Navigation */}

        <Link
          href="/user/tickets"
          className="text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          ← Back to My Tickets
        </Link>

        {/* Header */}

        <div className="mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-400">
                Ticket #{ticket.id}
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                {ticket.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Status */}

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  ticket.status === "OPEN"
                    ? "bg-blue-50 text-blue-700"
                    : ticket.status === "IN_PROGRESS"
                      ? "bg-amber-50 text-amber-700"
                      : ticket.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {ticket.status}
              </span>

              {/* Priority */}

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  ticket.priority === "CRITICAL"
                    ? "bg-red-50 text-red-700"
                    : ticket.priority === "HIGH"
                      ? "bg-orange-50 text-orange-700"
                      : ticket.priority === "MEDIUM"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Information */}

        <section className="mt-8 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Ticket Details
            </h2>
          </div>

          <div className="p-6">
            {/* Description */}

            <div>
              <p className="text-sm font-medium text-slate-500">Description</p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {ticket.description}
              </p>
            </div>

            {/* Metadata */}

            <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Created By
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {ticket.creator_name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {ticket.creator_email}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(ticket.created_at)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Last Updated
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(ticket.updated_at)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Priority
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {ticket.priority}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Attachments */}

        <section className="mt-8 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Attachments
            </h2>

            {ticket.status !== "CLOSED" &&
              attachments.length < MAX_ATTACHMENTS && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelection}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    + Upload
                  </button>
                </>
              )}
          </div>

          <div className="p-6">
            {/* Uploading */}

            {uploadingAttachments && (
              <p className="mb-4 text-sm text-indigo-600">
                Uploading images...
              </p>
            )}

            {/* Upload Error */}

            {uploadError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}

            {/* Existing Images */}

            {attachmentsLoading ? (
              <p className="text-sm text-slate-500">Loading attachments...</p>
            ) : attachmentsError ? (
              <p className="text-sm text-red-600">{attachmentsError}</p>
            ) : attachments.length === 0 ? (
              <p className="text-sm text-slate-500">No attachments uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group relative overflow-hidden rounded-xl border border-slate-200"
                  >
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="h-36 w-full object-cover transition duration-200 group-hover:scale-105"
                      />
                    </a>

                    {ticket.status !== "CLOSED" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        disabled={deletingAttachmentId === attachment.id}
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-red-600 shadow transition hover:bg-white disabled:opacity-50"
                      >
                        {deletingAttachmentId === attachment.id ? "..." : "×"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selected Files */}

            {selectedFiles.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-indigo-200"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-36 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleUploadAttachments}
                    disabled={uploadingAttachments}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingAttachments
                      ? "Uploading..."
                      : `Upload ${selectedFiles.length} ${
                          selectedFiles.length === 1 ? "Image" : "Images"
                        }`}
                  </button>
                </div>
              </div>
            )}

            {/* Closed Ticket */}

            {ticket.status === "CLOSED" && (
              <p className="mt-4 text-xs text-slate-400">
                Attachments cannot be modified because this ticket is closed.
              </p>
            )}
          </div>
        </section>

        {/* Ticket Conversation */}

        <TicketConversation
          comments={comments}
          currentUserId={currentUserId}
          loading={commentsLoading}
          error={commentsError}
          addingComment={addingComment}
          addCommentError={addCommentError}
          onAddComment={handleAddComment}
        />
      </div>
    </main>
  );
}
