import { supabase } from './data'

export async function sendNotification({
    userId,
    title,
    message,
    type = 'info'
}: {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
}) {
    try {
        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            title,
            message,
            type
        })
        if (error) throw error
        return { success: true }
    } catch (e) {
        console.error('Failed to send notification', e)
        return { success: false, error: e }
    }
}
