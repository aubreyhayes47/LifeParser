/**
 * NPC Schedule System
 * Utilities for checking NPC availability based on schedules
 */

/**
 * Get the day of week from game state
 * @param {number} day - Current game day (1-based)
 * @returns {string} Day name (monday, tuesday, etc.)
 */
export function getDayOfWeek(day) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days[(day - 1) % 7];
}

/**
 * Check if a time is within a schedule slot (including breaks)
 * @param {number} hour - Current hour (0-23)
 * @param {number} minute - Current minute (0-59)
 * @param {Object} slot - Schedule slot with startHour, endHour, and breaks
 * @returns {boolean} True if the time is within the slot and not on break
 */
function isTimeInSlot(hour, minute, slot) {
    const currentMinutes = hour * 60 + minute;
    const startMinutes = slot.startHour * 60;
    const endMinutes = slot.endHour * 60;

    // Check if time is within the main schedule window
    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
        return false;
    }

    // Check if time is during a break
    if (slot.breaks && Array.isArray(slot.breaks)) {
        for (const breakTime of slot.breaks) {
            const breakStart = breakTime.startHour * 60 + (breakTime.startMinute || 0);
            const breakEnd = breakTime.endHour * 60 + (breakTime.endMinute || 0);
            
            if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
                return false; // On break
            }
        }
    }

    return true;
}

/**
 * Check if an NPC is available at the current game time
 * @param {Object} npc - NPC data object with schedule
 * @param {number} day - Current game day
 * @param {number} hour - Current hour (0-23)
 * @param {number} minute - Current minute (0-59)
 * @returns {boolean} True if NPC is available
 */
export function isNPCAvailable(npc, day, hour, minute) {
    // If NPC has no schedule, they're always available (backward compatibility)
    if (!npc.schedule || !npc.schedule.available) {
        return true;
    }

    const dayOfWeek = getDayOfWeek(day);
    
    // Check each availability slot
    for (const slot of npc.schedule.available) {
        // Check if current day is in this slot's days
        if (slot.days.includes(dayOfWeek)) {
            // Check if current time is within this slot
            if (isTimeInSlot(hour, minute, slot)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Get a human-readable schedule description for an NPC
 * @param {Object} npc - NPC data object with schedule
 * @returns {string} Human-readable schedule description
 */
export function getNPCScheduleDescription(npc) {
    if (!npc.schedule || !npc.schedule.available) {
        return 'Available anytime';
    }

    const scheduleLines = [];
    
    for (const slot of npc.schedule.available) {
        const days = slot.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
        const startTime = formatTime(slot.startHour, 0);
        const endTime = formatTime(slot.endHour, 0);
        
        let line = `${days}: ${startTime} - ${endTime}`;
        
        if (slot.breaks && slot.breaks.length > 0) {
            const breakDescriptions = slot.breaks.map(b => {
                const breakStart = formatTime(b.startHour, b.startMinute || 0);
                const breakEnd = formatTime(b.endHour, b.endMinute || 0);
                return `${breakStart}-${breakEnd}`;
            }).join(', ');
            line += ` (Break: ${breakDescriptions})`;
        }
        
        scheduleLines.push(line);
    }

    return scheduleLines.join('\n');
}

/**
 * Format time in 12-hour format
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {string} Formatted time string
 */
function formatTime(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute}${period}`;
}

/**
 * Get next available time for an NPC
 * @param {Object} npc - NPC data object with schedule
 * @param {number} currentDay - Current game day
 * @param {number} currentHour - Current hour
 * @param {number} currentMinute - Current minute
 * @returns {string|null} Description of when NPC will next be available, or null if no schedule
 */
export function getNextAvailableTime(npc, currentDay, currentHour, currentMinute) {
    if (!npc.schedule || !npc.schedule.available) {
        return null; // Always available
    }

    const currentDayOfWeek = getDayOfWeek(currentDay);
    const currentMinutes = currentHour * 60 + currentMinute;
    
    // Check today's remaining schedule
    for (const slot of npc.schedule.available) {
        if (slot.days.includes(currentDayOfWeek)) {
            const startMinutes = slot.startHour * 60;
            
            // If the slot hasn't started yet today
            if (currentMinutes < startMinutes) {
                return `later today at ${formatTime(slot.startHour, 0)}`;
            }
            
            // Check if we're on break and will return
            if (slot.breaks && Array.isArray(slot.breaks)) {
                for (const breakTime of slot.breaks) {
                    const breakStart = breakTime.startHour * 60 + (breakTime.startMinute || 0);
                    const breakEnd = breakTime.endHour * 60 + (breakTime.endMinute || 0);
                    
                    if (currentMinutes >= breakStart && currentMinutes < breakEnd) {
                        return `after their break at ${formatTime(breakTime.endHour, breakTime.endMinute || 0)}`;
                    }
                }
            }
        }
    }
    
    // Check next days (up to 7 days ahead)
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
        const checkDay = currentDay + daysAhead;
        const checkDayOfWeek = getDayOfWeek(checkDay);
        
        for (const slot of npc.schedule.available) {
            if (slot.days.includes(checkDayOfWeek)) {
                const dayName = checkDayOfWeek.charAt(0).toUpperCase() + checkDayOfWeek.slice(1);
                return `on ${dayName} at ${formatTime(slot.startHour, 0)}`;
            }
        }
    }
    
    return 'Check their schedule';
}
