/**
 * Timezone utilities - Hong Kong Time (UTC+8)
 */

const HK_TIMEZONE = 'Asia/Hong_Kong';

function getHKTime() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: HK_TIMEZONE }));
}

function formatHKDate(date) {
    return date.toLocaleDateString('zh-TW', {
        timeZone: HK_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

function formatHKTime(date) {
    return date.toLocaleTimeString('zh-TW', {
        timeZone: HK_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

function formatHKDateTime(date) {
    return date.toLocaleString('zh-TW', {
        timeZone: HK_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function toHKISOString(date) {
    const hkDate = new Date(date.toLocaleString('en-US', { timeZone: HK_TIMEZONE }));
    return hkDate.toISOString();
}

module.exports = {
    HK_TIMEZONE,
    getHKTime,
    formatHKDate,
    formatHKTime,
    formatHKDateTime,
    toHKISOString,
};
