/**
 * Modern Card-Based Embed Design System
 */

const COLORS = {
    INFO: 0x9B59B6,
    SUCCESS: 0x1ABC9C,
    WARNING: 0xF39C12,
    ERROR: 0xE74C3C,
    NEUTRAL: 0x2F3136,
    MONEY: 0xF1C40F,
    CALENDAR: 0x3498DB,
};

const STATUS = {
    ACTIVE: '🟢',
    INACTIVE: '⚪',
    SUCCESS: '✅',
    PENDING: '⏳',
    WARNING: '⚠️',
    ERROR: '❌',
    ARROW: '▸',
    BULLET: '•',
    DIVIDER: '─',
};

function progressBar(percentage, length = 10) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return `[${'\u2588'.repeat(filled)}${'\u2591'.repeat(empty)}] ${percentage}%`;
}

function formatColumn(name, value, nameWidth = 12) {
    return `\`${name.padEnd(nameWidth)}| ${value}\``;
}

function divider(length = 24) {
    return STATUS.DIVIDER.repeat(length);
}

function footerFormat(user, timestamp = new Date()) {
    const timeStr = timestamp.toLocaleString('zh-HK', { 
        timeZone: 'Asia/Hong_Kong',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
    return `${user?.username || 'System'} - ${timeStr}`;
}

function formatMoney(amount, currency = 'HKD') {
    const symbols = {
        TWD: 'NT$',
        HKD: 'HK$',
        USD: 'US$',
        CNY: 'Y',
        JPY: 'Y',
    };
    const symbol = symbols[currency] || '$';
    return `${symbol}${parseFloat(amount).toLocaleString()}`;
}

function statusTag(status, labels = {}) {
    const defaultLabels = {
        active: '[ACTIVE]',
        inactive: '[INACTIVE]',
        pending: '[PENDING]',
        completed: '[DONE]',
        success: '[OK]',
        error: '[FAIL]',
        warning: '[WARN]',
    };
    return labels[status] || defaultLabels[status] || `[${status.toUpperCase()}]`;
}

function listItem(content, isActive = true) {
    const marker = isActive ? STATUS.SUCCESS : STATUS.PENDING;
    return `${marker} ${content}`;
}

const WEEKDAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEKDAYS_EN_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTHS_EN_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

module.exports = {
    COLORS,
    STATUS,
    progressBar,
    formatColumn,
    divider,
    footerFormat,
    formatMoney,
    statusTag,
    listItem,
    WEEKDAYS_EN,
    WEEKDAYS_EN_SHORT,
    MONTHS_EN,
    MONTHS_EN_SHORT,
};
