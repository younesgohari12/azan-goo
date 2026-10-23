import { el, Fragment } from '../../native/dom.js';
import { FileText, ImageIcon, X } from '../../icons.js';
import { IconButton } from '../ui/button.js';
import { Spinner } from '../ui/feedback.js';
import { cn, formatBytes, isLatinRun } from '../../lib/utils.js';
const STATUS_LABEL = {
    uploading: 'در حال بارگذاری',
    ready: 'آماده',
    error: 'خطا در بارگذاری',
};
export function AttachmentChip({ attachment, onRemove, className, }) {
    return (el("div", { className: cn('flex max-w-[15rem] items-center gap-2 rounded-y-sm border border-y-line bg-y-surface py-1.5 pe-1.5 ps-2', className) },
        el("span", { className: "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-y-xs bg-y-surface-hover text-y-ink-dim" }, attachment.previewUrl ? (el("img", { src: attachment.previewUrl, alt: attachment.name, className: "h-full w-full object-cover" })) : attachment.mime.startsWith('image/') ? (el(ImageIcon, { className: "h-3.5 w-3.5" })) : (el(FileText, { className: "h-3.5 w-3.5" }))),
        el("span", { className: "min-w-0 flex-1" },
            el("span", { className: cn('block truncate text-y-sm text-y-ink', isLatinRun(attachment.name) && 'yagent-ltr'), title: attachment.name }, attachment.name),
            el("span", { className: "mt-0.5 flex items-center gap-1.5 text-y-xs text-y-ink-dim" },
                el("span", { className: "yagent-num" }, formatBytes(attachment.size)),
                el("span", { "aria-hidden": true }, "\u00B7"),
                el("span", { className: cn('flex items-center gap-1', attachment.status === 'error' ? 'text-y-danger' : attachment.status === 'ready' ? 'text-y-success' : '') },
                    attachment.status === 'uploading' ? el(Spinner, { size: 11 }) : null,
                    STATUS_LABEL[attachment.status]))),
        onRemove ? (el(IconButton, { label: "\u062D\u0630\u0641 \u0641\u0627\u06CC\u0644", size: "xs", onClick: () => onRemove(attachment.id) },
            el(X, { className: "h-3.5 w-3.5" }))) : null));
}
export function AttachmentChips({ attachments, onRemove, }) {
    if (attachments.length === 0)
        return null;
    return (el("div", { className: "yagent-scroll mb-2 flex max-h-24 flex-wrap gap-2 overflow-y-auto" }, attachments.map((attachment) => (el(AttachmentChip, { key: attachment.id, attachment: attachment, onRemove: onRemove ? () => onRemove(attachment.id) : undefined })))));
}
