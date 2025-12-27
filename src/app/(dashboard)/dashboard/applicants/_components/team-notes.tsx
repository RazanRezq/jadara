"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslate } from "@/hooks/useTranslate"
import { toast } from "sonner"
import {
    MessageSquare,
    Send,
    Loader2,
    MoreVertical,
    Trash2,
    Edit,
    Lock,
    Unlock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface TeamNotesProps {
    applicantId: string
    // Hoisted props to prevent refetching on tab switch
    comments: Comment[]
    loading: boolean
    onCommentsChange: (comments: Comment[]) => void
}

interface Comment {
    id: string
    content: string
    isPrivate: boolean
    author: {
        id: string
        name: string
        email: string
        role: string
    }
    createdAt: string
    updatedAt: string
    isOwn: boolean
}

const roleColors: Record<string, string> = {
    superadmin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    reviewer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

export function TeamNotes({ applicantId, comments, loading, onCommentsChange }: TeamNotesProps) {
    const { t, dir } = useTranslate()
    const [submitting, setSubmitting] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Data now comes from props - no useEffect needed!

    const handleSubmit = async () => {
        if (!newComment.trim()) {
            toast.error("Please enter a comment")
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch("/api/comments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    applicantId,
                    content: newComment.trim(),
                    isPrivate,
                }),
            })

            const data = await response.json()
            if (data.success) {
                onCommentsChange([data.comment, ...comments])
                setNewComment("")
                setIsPrivate(false)
                toast.success("Comment added")
            } else {
                toast.error(data.error || "Failed to add comment")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        try {
            const response = await fetch(`/api/comments/delete/${commentId}`, {
                method: "DELETE",
            })

            const data = await response.json()
            if (data.success) {
                onCommentsChange(comments.filter((c) => c.id !== commentId))
                toast.success("Comment deleted")
            } else {
                toast.error(data.error || "Failed to delete comment")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const handleEdit = async (commentId: string) => {
        if (!editContent.trim()) {
            toast.error("Please enter a comment")
            return
        }

        try {
            const response = await fetch(`/api/comments/update/${commentId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent.trim() }),
            })

            const data = await response.json()
            if (data.success) {
                onCommentsChange(
                    comments.map((c) =>
                        c.id === commentId
                            ? { ...c, content: editContent.trim(), updatedAt: new Date().toISOString() }
                            : c
                    )
                )
                setEditingId(null)
                setEditContent("")
                toast.success("Comment updated")
            } else {
                toast.error(data.error || "Failed to update comment")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const startEditing = (comment: Comment) => {
        setEditingId(comment.id)
        setEditContent(comment.content)
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    if (loading) {
        return (
            <Card dir={dir}>
                <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card dir={dir}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    {t("applicants.comments.title")}
                </CardTitle>
                <CardDescription>
                    {t("applicants.comments.description")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* New Comment Form */}
                <div className="space-y-2">
                    <Textarea
                        ref={textareaRef}
                        placeholder={t("applicants.comments.placeholder")}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant={isPrivate ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setIsPrivate(!isPrivate)}
                            className="text-xs"
                        >
                            {isPrivate ? (
                                <>
                                    <Lock className="h-3 w-3 me-1" />
                                    {t("applicants.comments.privateNote")}
                                </>
                            ) : (
                                <>
                                    <Unlock className="h-3 w-3 me-1" />
                                    {t("applicants.comments.sharedNote")}
                                </>
                            )}
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting} size="sm">
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                                    {t("applicants.comments.postingNote")}
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 me-2" />
                                    {t("applicants.comments.post")}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{t("applicants.comments.noComments")}</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div
                                key={comment.id}
                                className={cn(
                                    "flex gap-3 p-3 rounded-lg transition-colors",
                                    comment.isPrivate
                                        ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                                        : "bg-muted/50 hover:bg-muted"
                                )}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                        {getInitials(comment.author.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm">
                                            {comment.author.name}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "text-xs",
                                                roleColors[comment.author.role]
                                            )}
                                        >
                                            {comment.author.role}
                                        </Badge>
                                        {comment.isPrivate && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs border-amber-400 text-amber-600"
                                            >
                                                <Lock className="h-2.5 w-2.5 me-1" />
                                                {t("applicants.comments.private")}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    </div>

                                    {editingId === comment.id ? (
                                        <div className="mt-2 space-y-2">
                                            <Textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={2}
                                                className="resize-none"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleEdit(comment.id)}
                                                >
                                                    {t("applicants.comments.save")}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingId(null)
                                                        setEditContent("")
                                                    }}
                                                >
                                                    {t("applicants.comments.cancel")}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-sm whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    )}
                                </div>

                                {comment.isOwn && editingId !== comment.id && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => startEditing(comment)}>
                                                <Edit className="h-4 w-4 me-2" />
                                                {t("applicants.comments.edit")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(comment.id)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4 me-2" />
                                                {t("applicants.comments.delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
