"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import Link from "next/link";

import TicketConversation from "@/components/tickets/TicketConversation";

import api from "@/lib/axios";

import type { Ticket, TicketStatus } from "@/types/ticket";

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

const getStatusClasses = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700";

    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700";

    case "CLOSED":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getPriorityClasses = (priority: string) => {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-50 text-red-700";

    case "HIGH":
      return "bg-orange-50 text-orange-700";

    case "MEDIUM":
      return "bg-blue-50 text-blue-700";

    case "LOW":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-slate-100 text-slate-600";
  }
};

export default function AgentTicketDetails() {
  const router = useRouter();

  const params = useParams();

  const ticketId = params.id;

  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // Comments
  // =========================

  const [comments, setComments] = useState<Comment[]>([]);

  const [commentsLoading, setCommentsLoading] = useState(true);

  const [commentsError, setCommentsError] = useState("");

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [addingComment, setAddingComment] = useState(false);

  const [addCommentError, setAddCommentError] = useState("");

  // =========================
  // Status
  // =========================

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "">("");

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [statusError, setStatusError] = useState("");

  const [statusSuccess, setStatusSuccess] = useState("");

  // =========================
  // Attachments
  // =========================

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [attachmentsLoading, setAttachmentsLoading] = useState(true);

  const [attachmentsError, setAttachmentsError] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  const [uploadError, setUploadError] = useState("");

  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    number | null
  >(null);

  // =========================
  // Comments
  // =========================

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);

      setCommentsError("");

      const response = await api.get(`/tickets/${ticketId}/comments`);

      setComments(response.data.comments);
    } catch (error) {
      console.error(error);

      setCommentsError("Failed to load conversation");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (message: string): Promise<boolean> => {
    setAddCommentError("");

    try {
      setAddingComment(true);

      await api.post(`/tickets/${ticketId}/comments`, {
        message,
      });

      await fetchComments();

      return true;
    } catch (error) {
      console.error(error);

      setAddCommentError("Failed to send message");

      return false;
    } finally {
      setAddingComment(false);
    }
  };

  // =========================
  // Status Update
  // =========================

  const handleStatusUpdate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedStatus) {
      setStatusError("Please select a status");

      return;
    }

    if (selectedStatus === ticket?.status) {
      return;
    }

    try {
      setUpdatingStatus(true);

      setStatusError("");

      setStatusSuccess("");

      await api.patch(`/tickets/${ticketId}/status`, {
        status: selectedStatus,
      });

      setTicket((previousTicket) => {
        if (!previousTicket) {
          return previousTicket;
        }

        return {
          ...previousTicket,
          status: selectedStatus,
          updated_at: new Date().toISOString(),
        };
      });

      setStatusSuccess("Ticket status updated successfully");
    } catch (error) {
      console.error(error);

      setStatusError("Failed to update ticket status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // =========================
  // Load Attachments
  // =========================

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

  // =========================
  // Refresh Attachments
  // =========================

  const fetchAttachments = async () => {
    try {
      setAttachmentsError("");

      const response = await api.get(`/tickets/${ticketId}/attachments`);

      setAttachments(response.data.attachments);
    } catch (error) {
      console.error(error);

      setAttachmentsError("Failed to refresh attachments");
    }
  };

  // =========================
  // File Selection
  // =========================

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
          remainingSlots !== 1 ? "s" : ""
        }.`,
      );

      event.target.value = "";

      return;
    }

    const invalidFile = files.find(
      (file) => !ALLOWED_FILE_TYPES.includes(file.type),
    );

    if (invalidFile) {
      setUploadError("Only JPG, JPEG, PNG, and WEBP images are allowed.");

      event.target.value = "";

      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      setUploadError("Each image must be 5 MB or smaller.");

      event.target.value = "";

      return;
    }

    setSelectedFiles((previousFiles) => [...previousFiles, ...files]);

    event.target.value = "";
  };

  // =========================
  // Remove Selected File
  // =========================

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((previousFiles) =>
      previousFiles.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  // =========================
  // Upload Attachments
  // =========================

  const handleUploadAttachments = async () => {
    if (selectedFiles.length === 0) {
      return;
    }

    // IMPORTANT:
    // ticket can initially be null while the page is loading.
    if (!ticket) {
      return;
    }

    if (ticket.status === "CLOSED") {
      setUploadError("Closed tickets cannot be modified.");

      return;
    }

    if (attachments.length + selectedFiles.length > MAX_ATTACHMENTS) {
      setUploadError("A ticket can have a maximum of 5 images.");

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

      setUploadError("Failed to upload attachments.");
    } finally {
      setUploadingAttachments(false);
    }
  };

  // =========================
  // Delete Attachment
  // =========================

  const handleDeleteAttachment = async (attachmentId: number) => {
    // IMPORTANT:
    // ticket can initially be null while the page is loading.
    if (!ticket) {
      return;
    }

    if (ticket.status === "CLOSED") {
      return;
    }

    try {
      setDeletingAttachmentId(attachmentId);

      setUploadError("");

      await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);

      setAttachments((previousAttachments) =>
        previousAttachments.filter(
          (attachment) => attachment.id !== attachmentId,
        ),
      );
    } catch (error) {
      console.error(error);

      setUploadError("Failed to delete attachment.");
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  // =========================
  // Load Ticket
  // =========================

  useEffect(() => {
    const loadTicketPage = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");

        return;
      }

      try {
        setLoading(true);

        setError("");

        const [userResponse, ticketResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get(`/tickets/${ticketId}`),
        ]);

        const currentUser = userResponse.data;

        const ticketData = ticketResponse.data.ticket;

        // =========================
        // Role Protection
        // =========================

        if (currentUser.role !== "AGENT") {
          if (currentUser.role === "CUSTOMER") {
            router.push("/user");
          } else if (currentUser.role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/login");
          }

          return;
        }

        setCurrentUserId(currentUser.id);

        setTicket(ticketData);

        setSelectedStatus(ticketData.status);

        await fetchComments();
      } catch (error) {
        console.error(error);

        setError("Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    loadTicketPage();
  }, [ticketId, router]);

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <main className="min-h-full">
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-sm text-slate-500">Loading ticket...</p>
        </div>
      </main>
    );
  }

  // =========================
  // Error
  // =========================

  if (error || !ticket) {
    return (
      <main className="min-h-full">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">{error || "Ticket not found"}</p>

          <Link
            href="/agent/tickets"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Back to Assigned Tickets
          </Link>
        </div>
      </main>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-5xl">
        {/* Back Navigation */}

        <Link
          href="/agent/tickets"
          className="text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          ← Back to Assigned Tickets
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
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                  ticket.status,
                )}`}
              >
                {ticket.status}
              </span>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getPriorityClasses(
                  ticket.priority,
                )}`}
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
                  Customer
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

        {/* Status Update */}

        <section className="mt-6 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Update Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update the current progress of this ticket.
            </p>
          </div>

          <div className="p-6">
            {statusError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">{statusError}</p>
              </div>
            )}

            {statusSuccess && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm text-emerald-700">{statusSuccess}</p>
              </div>
            )}

            <form
              onSubmit={handleStatusUpdate}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-slate-700"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as TicketStatus)
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="OPEN">Open</option>

                  <option value="IN_PROGRESS">In Progress</option>

                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={updatingStatus || selectedStatus === ticket.status}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingStatus ? "Updating..." : "Update Status"}
              </button>
            </form>
          </div>
        </section>

        {/* ========================= */}
        {/* Attachments */}
        {/* ========================= */}

        <section className="mt-6 rounded-xl border border-slate-200 bg-white">
          {/* Attachment Header */}

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
              <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                <p className="text-sm text-indigo-700">Uploading images...</p>
              </div>
            )}

            {/* Upload Error */}

            {uploadError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}

            {/* Existing Attachments */}

            {attachmentsLoading ? (
              <p className="text-sm text-slate-500">Loading attachments...</p>
            ) : attachmentsError ? (
              <p className="text-sm text-red-600">{attachmentsError}</p>
            ) : attachments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No attachments uploaded yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="h-36 w-full object-cover transition group-hover:scale-105"
                      />
                    </a>

                    {/* Delete */}

                    {ticket.status !== "CLOSED" && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        disabled={deletingAttachmentId === attachment.id}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete attachment"
                      >
                        ×
                      </button>
                    )}

                    <div className="border-t border-slate-200 bg-white px-3 py-2">
                      <p className="truncate text-xs text-slate-600">
                        {attachment.file_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Files */}

            {selectedFiles.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Selected Images
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {selectedFiles.length} image
                      {selectedFiles.length !== 1 ? "s" : ""} selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFiles([])}
                    className="text-xs font-medium text-slate-500 hover:text-red-600"
                  >
                    Clear all
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-36 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeSelectedFile(index)}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white transition hover:bg-red-600"
                        title="Remove selected image"
                      >
                        ×
                      </button>

                      <div className="border-t border-slate-200 bg-white px-3 py-2">
                        <p className="truncate text-xs text-slate-600">
                          {file.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload Selected */}

                <button
                  type="button"
                  onClick={handleUploadAttachments}
                  disabled={uploadingAttachments}
                  className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingAttachments
                    ? "Uploading..."
                    : `Upload ${selectedFiles.length} Image${
                        selectedFiles.length !== 1 ? "s" : ""
                      }`}
                </button>
              </div>
            )}

            {/* Closed Ticket */}

            {ticket.status === "CLOSED" && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">
                  Attachments cannot be modified because this ticket is closed.
                </p>
              </div>
            )}

            {/* Maximum Attachments */}

            {ticket.status !== "CLOSED" &&
              attachments.length >= MAX_ATTACHMENTS && (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Maximum of 5 attachments reached.
                  </p>
                </div>
              )}
          </div>
        </section>

        {/* Conversation */}

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
