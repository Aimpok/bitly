/* Events.js */

// Helper to calculate dates relative to "now" for demonstration
const now = new Date();

export const eventsData = [
    {
        id: 1,
        title: "Auction",
        icon: "Sprites/Hymmer.png", // Make sure to add this image to your folder
        bgImage: "Sprites/WaveBg.png",
        link: "auction.html",
        // Example: Started 1 hour ago, Ends in 23 hours (Active)
        startTime: new Date(now.getTime() - (1 * 60 * 60 * 1000)).toISOString(),
        endTime: new Date(now.getTime() + (23 * 60 * 60 * 1000)).toISOString()
    },
    {
        id: 2,
        title: "Staking", // The percentage icon usually implies staking/APR
        icon: "Sprites/Procent.png", // Make sure to add this image to your folder
        bgImage: "Sprites/WaveBg.png",
        link: "staking.html",
        // Example: Starts in 23 hours (Upcoming/Inactive)
        startTime: new Date(now.getTime() + (23 * 60 * 60 * 1000)).toISOString(),
        endTime: new Date(now.getTime() + (48 * 60 * 60 * 1000)).toISOString()
    }
];

/**
 * Calculates the status string (e.g., "Ends in 23 hours" or "Start in 5 hours")
 */
export function getEventStatus(event) {
    const current = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    // 1. Event hasn't started yet
    if (current < start) {
        const diffMs = start - current;
        const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
        return {
            text: `Start in ${diffHrs} hours`,
            isActive: false
        };
    }
    
    // 2. Event is currently active
    if (current >= start && current < end) {
        const diffMs = end - current;
        const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
        return {
            text: `Ends in ${diffHrs} hours`,
            isActive: true
        };
    }

    // 3. Event ended
    return {
        text: "Ended",
        isActive: false
    };
}