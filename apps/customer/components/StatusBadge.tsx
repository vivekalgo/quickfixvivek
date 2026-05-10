import { BookingStatus } from '@/lib/data'

const STATUS_CONFIG: Record<BookingStatus, { label: string; class: string; icon: string }> = {
    requested: { label: 'Requested', class: 'status-requested', icon: '📋' },
    accepted: { label: 'Accepted', class: 'status-accepted', icon: '✅' },
    'on-the-way': { label: 'On the Way', class: 'status-on-the-way', icon: '🚗' },
    'in-progress': { label: 'In Progress', class: 'status-in-progress', icon: '🔧' },
    completed: { label: 'Completed', class: 'status-completed', icon: '🎉' },
    cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: '❌' },
}

export default function StatusBadge({ status }: { status: BookingStatus }) {
    const config = STATUS_CONFIG[status]
    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.class}`}>
            {config.icon} {config.label}
        </span>
    )
}
