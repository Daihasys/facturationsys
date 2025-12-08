/**
 * Telegram Notification Service
 * Handles sending notifications to Telegram bot
 */

require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Send a message to Telegram
 * @param {string} message - Message to send (supports HTML formatting)
 * @returns {Promise<boolean>} - Whether the message was sent successfully
 */
async function sendTelegramNotification(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('[Telegram] Bot token or chat ID not configured, skipping notification');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            console.error('[Telegram] Failed to send notification:', await response.text());
            return false;
        }

        console.log('[Telegram] Notification sent successfully');
        return true;
    } catch (error) {
        console.error('[Telegram] Error sending notification:', error.message);
        return false;
    }
}

/**
 * Send a manual error report notification
 */
async function notifyManualErrorReport({ reportId, modulo, username, accion, descripcion }) {
    const now = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });

    const message = `📝 <b>Reporte Manual de Error</b>

<b>Catire Vrs</b>
📦 <b>Módulo:</b> ${modulo}
👤 <b>Usuario:</b> ${username}
📅 <b>Fecha:</b> ${now}

<b>Acción:</b>
${accion}

<b>Descripción:</b>
${descripcion}

<i>ID del reporte: #${reportId}</i>`;

    return sendTelegramNotification(message);
}

/**
 * Send an automatic error notification (system-detected errors)
 */
async function notifyAutomaticError({ reportId, source, errorMessage, stackTrace, url, username }) {
    const now = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });

    // Truncate stack trace if too long
    const truncatedStack = stackTrace && stackTrace.length > 500
        ? stackTrace.substring(0, 500) + '...'
        : stackTrace || 'No stack trace';

    const message = `🚨 <b>Error Automático Detectado</b>

<b>Catire Vrs</b>
⚠️ <b>Origen:</b> ${source}
👤 <b>Usuario:</b> ${username || 'No identificado'}
📅 <b>Fecha:</b> ${now}
${url ? `🔗 <b>URL:</b> ${url}` : ''}

<b>Error:</b>
<code>${errorMessage}</code>

<b>Stack Trace:</b>
<pre>${truncatedStack}</pre>

<i>ID del reporte: #${reportId}</i>`;

    return sendTelegramNotification(message);
}

module.exports = {
    sendTelegramNotification,
    notifyManualErrorReport,
    notifyAutomaticError
};
