export const formatTimeTo12Hour = timeString => {
    const date = new Date(timeString), h = date.getHours(), m = date.getMinutes();
    return `${h % 12 || 12}:${m < 10 ? '0' + m : m} ${h >= 12 ? 'PM' : 'AM'}`;
};

export function formatTurnover(turnover) {
    const lakh = 1e5;
    const crore = 1e7;
    const arba = 1e9;

    if (turnover >= arba) {
        return (turnover / arba).toFixed(1) + ' Arba';
    } else if (turnover >= crore) {
        return (turnover / crore).toFixed(1) + ' Crore';
    } else if (turnover >= lakh) {
        return (turnover / lakh).toFixed(1) + ' Lakh';
    } else {
        return turnover.toFixed(2) + ' Rs';
    }
}
