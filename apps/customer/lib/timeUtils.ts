/**
 * Helper to check if a shop is currently open based on its time slot
 * Format expected: "09:00 AM" and "08:00 PM"
 */
export function isShopOpen(openStr: string, closeStr: string): boolean {
    if (!openStr || !closeStr) return false

    try {
        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes()

        const parseTime = (timeStr: string) => {
            const [time, modifier] = timeStr.split(' ')
            let [hours, minutes] = time.split(':').map(Number)

            if (modifier === 'PM' && hours < 12) hours += 12
            if (modifier === 'AM' && hours === 12) hours = 0

            return hours * 60 + minutes
        }

        const openTime = parseTime(openStr)
        const closeTime = parseTime(closeStr)

        if (closeTime > openTime) {
            return currentTime >= openTime && currentTime <= closeTime
        } else {
            // Handles overnight shifts (e.g., 10 PM to 6 AM)
            return currentTime >= openTime || currentTime <= closeTime
        }
    } catch (e) {
        return false
    }
}
