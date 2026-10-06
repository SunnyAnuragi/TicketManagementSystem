"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { useParams, useRouter } from "next/navigation";

import api from "@/lib/axios";

import TicketConversation from "@/components/tickets/TicketConversation";

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

type TicketHistory = {
  id: number;
  ticket_id: number;
  user_id: number | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user_name: string | null;
};

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
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

export default function AdminTicketDetails() {
  const params = useParams();

  const router = useRouter();

  const ticketId = params.id as string;

  // =========================
  // Ticket
  // =========================

  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================
  // Comments
  // =========================

  const [comments, setComments] = useState<Comment[]>([]);

  const [loadingComments, setLoadingComments] = useState(true);

  const [addingComment, setAddingComment] = useState(false);

  const [commentError, setCommentError] = useState("");

  // =========================
  // Ticket History
  // =========================

  const [history, setHistory] = useState<TicketHistory[]>([]);

  const [loadingHistory, setLoadingHistory] = useState(true);

  const [historyError, setHistoryError] = useState("");

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
  // Fetch Comments
  // =========================

  const fetchComments = async () => {
    try {
      setLoadingComments(true);

      setCommentError("");

      const response = await api.get(`/tickets/${ticketId}/comments`);

      setComments(response.data.comments || []);
    } catch (error) {
      console.error(error);

      setCommentError("Failed to load comments.");
    } finally {
      setLoadingComments(false);
    }
  };

  // =========================
  // Fetch History
  // =========================

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);

      setHistoryError("");

      const response = await api.get(`/tickets/${ticketId}/history`);

      setHistory(response.data.history || []);
    } catch (error) {
      console.error(error);

      setHistoryError("Failed to load ticket history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  // =========================
  // Add Comment
  // =========================

  const handleAddComment = async (message: string): Promise<boolean> => {
    if (!message.trim()) {
      setCommentError("Comment cannot be empty.");

      return false;
    }

    try {
      setAddingComment(true);

      setCommentError("");

      await api.post(`/tickets/${ticketId}/comments`, {
        message: message.trim(),
      });

      await fetchComments();

      return true;
    } catch (error) {
      console.error(error);

      setCommentError("Failed to add comment.");

      return false;
    } finally {
      setAddingComment(false);
    }
  };

  // =========================
  // Status Update
  // =========================

  const handleStatusUpdate = async () => {
    if (!ticket || !selectedStatus) {
      return;
    }

    if (ticket.status === "CLOSED") {
      return;
    }

    if (selectedStatus === ticket.status) {
      return;
    }

    try {
      setUpdatingStatus(true);

      setStatusError("");

      setStatusSuccess("");

      await api.patch(`/tickets/${ticketId}/status`, {
        status: selectedStatus,
      });

      setTicket({
        ...ticket,
        status: selectedStatus,
      });

      setStatusSuccess("Ticket status updated successfully.");

      await fetchHistory();
    } catch (error) {
      console.error(error);

      setStatusError("Failed to update ticket status.");
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

        setAttachments(response.data.attachments || []);
      } catch (error) {
        console.error(error);

        setAttachmentsError("Failed to load attachments.");
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

      setAttachments(response.data.attachments || []);
    } catch (error) {
      console.error(error);

      setAttachmentsError("Failed to refresh attachments.");
    }
  };

  // =========================
  // Select Files
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
    const fetchTicket = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");

        return;
      }

      try {
        setLoading(true);

        setError("");

        const userResponse = await api.get("/auth/me");

        const user: CurrentUser = userResponse.data;

        // =========================
        // Admin Role Protection
        // =========================

        if (user.role !== "ADMIN") {
          if (user.role === "AGENT") {
            router.push("/agent");
          } else {
            router.push("/user");
          }

          return;
        }

        setCurrentUser(user);

        const ticketResponse = await api.get(`/tickets/${ticketId}`);

        const fetchedTicket: Ticket = ticketResponse.data.ticket;

        setTicket(fetchedTicket);

        setSelectedStatus(fetchedTicket.status);

        await Promise.all([fetchComments(), fetchHistory()]);
      } catch (error) {
        console.error(error);

        setError("Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId, router]);

  // =========================
  // Status Classes
  // =========================

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "OPEN":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "IN_PROGRESS":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "RESOLVED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "CLOSED":
        return "border-slate-200 bg-slate-100 text-slate-600";

      default:
        return "border-slate-200 bg-slate-100 text-slate-600";
    }
  };

  // =========================
  // Priority Classes
  // =========================

  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "border-slate-200 bg-slate-100 text-slate-600";

      case "MEDIUM":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "HIGH":
        return "border-orange-200 bg-orange-50 text-orange-700";

      case "CRITICAL":
        return "border-red-200 bg-red-50 text-red-700";

      default:
        return "border-slate-200 bg-slate-100 text-slate-600";
    }
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-sm text-slate-500">Loading ticket...</p>
      </div>
    );
  }

  // =========================
  // Error
  // =========================

  if (error || !ticket) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/tickets"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to All Tickets
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">{error || "Ticket not found."}</p>
        </div>
      </div>
    );
  }

  // =========================
  // Main UI
  // =========================

  return (
    <div className="space-y-6">
      {/* Back Navigation */}

      <Link
        href="/admin/tickets"
        className="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Back to All Tickets
      </Link>

      {/* ========================= */}
      {/* Ticket Header */}
      {/* ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Ticket #{ticket.id}
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {ticket.title}
            </h1>

            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {ticket.description}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClasses(
                ticket.status,
              )}`}
            >
              {ticket.status}
            </span>

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getPriorityClasses(
                ticket.priority,
              )}`}
            >
              {ticket.priority}
            </span>
          </div>
        </div>

        {/* Metadata */}

        <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Customer
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {ticket.creator_name}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {ticket.creator_email}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Assigned Agent
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {ticket.assigned_agent_name || "Not assigned"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Created
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {new Date(ticket.created_at).toLocaleString("en-IN")}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Last Updated
            </p>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {new Date(ticket.updated_at).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>

      {/* ========================= */}
      {/* Status Management */}
      {/* ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Manage Status
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update the current state of this ticket.
          </p>
        </div>

        {statusError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{statusError}</p>
          </div>
        )}

        {statusSuccess && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-700">{statusSuccess}</p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedStatus}
            onChange={(event) => {
              setSelectedStatus(event.target.value as TicketStatus);

              setStatusError("");

              setStatusSuccess("");
            }}
            disabled={ticket.status === "CLOSED"}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="OPEN">OPEN</option>

            <option value="IN_PROGRESS">IN_PROGRESS</option>

            <option value="RESOLVED">RESOLVED</option>

            <option value="CLOSED">CLOSED</option>
          </select>

          <button
            type="button"
            onClick={handleStatusUpdate}
            disabled={
              updatingStatus ||
              selectedStatus === ticket.status ||
              ticket.status === "CLOSED"
            }
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingStatus ? "Updating..." : "Update Status"}
          </button>
        </div>

        {ticket.status === "CLOSED" && (
          <p className="mt-3 text-xs text-slate-500">
            Closed tickets cannot be modified.
          </p>
        )}
      </section>

      {/* ========================= */}
      {/* Attachments */}
      {/* ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Attachments</h2>

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

          {/* Error */}

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

      {/* ========================= */}
      {/* Conversation */}
      {/* ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        {commentError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{commentError}</p>
          </div>
        )}

        <TicketConversation
          comments={comments}
          currentUserId={currentUser?.id || null}
          loading={loadingComments}
          error=""
          addingComment={addingComment}
          addCommentError=""
          onAddComment={handleAddComment}
        />
      </section>

      {/* ========================= */}
      {/* Ticket History */}
      {/* ========================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Ticket History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track important changes made to this ticket.
          </p>
        </div>

        {loadingHistory && (
          <p className="mt-5 text-sm text-slate-500">
            Loading ticket history...
          </p>
        )}

        {historyError && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{historyError}</p>
          </div>
        )}

        {!loadingHistory && !historyError && history.length === 0 && (
          <p className="mt-5 text-sm text-slate-500">No history available.</p>
        )}

        {!loadingHistory && !historyError && history.length > 0 && (
          <div className="mt-5 space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item.action}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      By {item.user_name || "System"}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString("en-IN")}
                  </p>
                </div>

                {(item.old_value || item.new_value) && (
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    {item.old_value && (
                      <p>
                        <span className="font-medium text-slate-700">Old:</span>{" "}
                        {item.old_value}
                      </p>
                    )}

                    {item.new_value && (
                      <p>
                        <span className="font-medium text-slate-700">New:</span>{" "}
                        {item.new_value}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
