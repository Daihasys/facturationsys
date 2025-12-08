/**
 * Dropbox Cloud Backup Integration
 * Automatically uploads backups to Dropbox with smart retention policy
 */

const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');

// Initialize Dropbox client
const DROPBOX_ACCESS_TOKEN = process.env.DROPBOX_ACCESS_TOKEN;
const DROPBOX_FOLDER = '/Aplicaciones/facsystem';

let dbx = null;

/**
 * Initialize Dropbox client
 */
function initDropbox() {
    if (!DROPBOX_ACCESS_TOKEN) {
        console.log('[Dropbox] No access token configured. Cloud backups disabled.');
        return false;
    }

    dbx = new Dropbox({ accessToken: DROPBOX_ACCESS_TOKEN });
    console.log('[Dropbox] Cloud backup integration initialized.');
    return true;
}

/**
 * Upload a backup file to Dropbox
 * @param {string} localFilePath - Full path to the local backup file
 * @returns {Promise<object>} - Upload result
 */
async function uploadBackup(localFilePath) {
    if (!dbx) {
        if (!initDropbox()) {
            return { success: false, error: 'Dropbox not configured' };
        }
    }

    try {
        const fileName = path.basename(localFilePath);
        const dropboxPath = `${DROPBOX_FOLDER}/${fileName}`;
        const fileContent = fs.readFileSync(localFilePath);

        console.log(`[Dropbox] Uploading ${fileName}...`);

        const response = await dbx.filesUpload({
            path: dropboxPath,
            contents: fileContent,
            mode: { '.tag': 'overwrite' }
        });

        console.log(`[Dropbox] Upload successful: ${fileName}`);

        // Cleanup old backups in Dropbox after successful upload
        await cleanupDropboxBackups();

        return { success: true, path: response.result.path_display };
    } catch (error) {
        console.error(`[Dropbox] Upload failed:`, error.message || error);
        if (error.error) {
            console.error(`[Dropbox] Error details:`, JSON.stringify(error.error, null, 2));
        }
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Get week key for a date (year-week format)
 */
function getWeekKey(date) {
    const d = new Date(date);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
}

/**
 * Parse backup filename to get date
 * Example: backup-2025-12-08T14-30-00-000Z.db
 */
function parseBackupDate(filename) {
    try {
        // Extract date portion: backup-YYYY-MM-DDTHH-MM-SS-MMMZ.db
        const match = filename.match(/backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
        if (match) {
            // Convert back to ISO format
            const dateStr = match[1].replace(/-(\d{2})-(\d{2})$/, ':$1:$2').replace(/T(\d{2})-/, 'T$1:');
            return new Date(dateStr);
        }
    } catch (e) {
        // Ignore parsing errors
    }
    return null;
}

/**
 * Cleanup old backups in Dropbox using same 3-2-1 strategy as local
 * - Last 24 hours: keep max 30
 * - Last week: 1 per day
 * - Last month: 1 per week
 */
async function cleanupDropboxBackups() {
    if (!dbx) return;

    try {
        // List all files in the backup folder
        let allFiles = [];
        let hasMore = true;
        let cursor = null;

        // Handle pagination for large folders
        while (hasMore) {
            let response;
            if (cursor) {
                response = await dbx.filesListFolderContinue({ cursor });
            } else {
                try {
                    response = await dbx.filesListFolder({ path: DROPBOX_FOLDER });
                } catch (error) {
                    if (error.status === 409) {
                        // Folder doesn't exist yet, nothing to clean
                        console.log('[Dropbox Cleanup] Backup folder does not exist yet.');
                        return;
                    }
                    throw error;
                }
            }

            allFiles = allFiles.concat(response.result.entries);
            hasMore = response.result.has_more;
            cursor = response.result.cursor;
        }

        // Filter only backup files
        const backupFiles = allFiles
            .filter(f => f['.tag'] === 'file' && f.name.startsWith('backup-') && f.name.endsWith('.db'))
            .map(f => ({
                name: f.name,
                path: f.path_display,
                mtime: parseBackupDate(f.name) || new Date(f.server_modified)
            }))
            .sort((a, b) => b.mtime - a.mtime); // Most recent first

        // If less than 60 files, no cleanup needed
        if (backupFiles.length <= 60) {
            return;
        }

        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const toKeep = new Set();
        const categorized = {
            last24h: [],
            lastWeek: [],
            lastMonth: [],
            older: []
        };

        // Categorize backups
        backupFiles.forEach(file => {
            if (file.mtime > oneDayAgo) {
                categorized.last24h.push(file);
            } else if (file.mtime > oneWeekAgo) {
                categorized.lastWeek.push(file);
            } else if (file.mtime > oneMonthAgo) {
                categorized.lastMonth.push(file);
            } else {
                categorized.older.push(file);
            }
        });

        // Last 24 hours: keep max 30
        categorized.last24h.slice(0, 30).forEach(f => toKeep.add(f.path));

        // Last week: 1 per day
        const dailyBackups = {};
        categorized.lastWeek.forEach(file => {
            const dateKey = file.mtime.toISOString().split('T')[0];
            if (!dailyBackups[dateKey] || file.mtime > dailyBackups[dateKey].mtime) {
                dailyBackups[dateKey] = file;
            }
        });
        Object.values(dailyBackups).forEach(f => toKeep.add(f.path));

        // Last month: 1 per week
        const weeklyBackups = {};
        categorized.lastMonth.forEach(file => {
            const weekKey = getWeekKey(file.mtime);
            if (!weeklyBackups[weekKey] || file.mtime > weeklyBackups[weekKey].mtime) {
                weeklyBackups[weekKey] = file;
            }
        });
        Object.values(weeklyBackups).forEach(f => toKeep.add(f.path));

        // Delete files not in toKeep
        const toDelete = backupFiles.filter(f => !toKeep.has(f.path));

        if (toDelete.length > 0) {
            console.log(`[Dropbox Cleanup] Deleting ${toDelete.length} old backups...`);

            // Use batch delete for efficiency
            const deleteEntries = toDelete.map(f => ({ path: f.path }));

            // Dropbox batch delete limit is 1000, but we'll likely have far fewer
            await dbx.filesDeleteBatch({ entries: deleteEntries });

            console.log(`[Dropbox Cleanup] Deleted ${toDelete.length} backups. Kept: ${toKeep.size}`);
        }

    } catch (error) {
        console.error('[Dropbox Cleanup] Error during cleanup:', error.message || error);
    }
}

/**
 * List all backups in Dropbox
 * @returns {Promise<Array>} - List of backup files
 */
async function listDropboxBackups() {
    if (!dbx) {
        if (!initDropbox()) {
            return [];
        }
    }

    try {
        const response = await dbx.filesListFolder({ path: DROPBOX_FOLDER });

        return response.result.entries
            .filter(f => f['.tag'] === 'file' && f.name.endsWith('.db'))
            .map(f => ({
                name: f.name,
                path: f.path_display,
                size: f.size,
                modified: f.server_modified
            }))
            .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    } catch (error) {
        if (error.status === 409) {
            // Folder doesn't exist
            return [];
        }
        console.error('[Dropbox] Error listing backups:', error.message || error);
        return [];
    }
}

/**
 * Check if Dropbox is configured and working
 * @returns {Promise<object>} - Status object
 */
async function getDropboxStatus() {
    if (!DROPBOX_ACCESS_TOKEN) {
        return { configured: false, connected: false, error: 'No access token' };
    }

    if (!dbx) {
        initDropbox();
    }

    try {
        const account = await dbx.usersGetCurrentAccount();
        return {
            configured: true,
            connected: true,
            email: account.result.email,
            name: account.result.name.display_name
        };
    } catch (error) {
        return {
            configured: true,
            connected: false,
            error: error.message || 'Connection failed'
        };
    }
}

// Initialize on load
initDropbox();

module.exports = {
    uploadBackup,
    listDropboxBackups,
    getDropboxStatus,
    cleanupDropboxBackups
};
