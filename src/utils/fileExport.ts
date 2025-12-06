import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Export data as a file. Works in both web browsers and Capacitor Android.
 * On Android, uses the Share API to allow users to save/share the file.
 * On web, uses the traditional download approach.
 */
export async function exportFile(
    data: string,
    filename: string,
    mimeType: string
): Promise<void> {
    if (Capacitor.isNativePlatform()) {
        // Native platform (Android/iOS) - use Filesystem + Share
        try {
            // Write file to cache directory
            const result = await Filesystem.writeFile({
                path: filename,
                data: data,
                directory: Directory.Cache,
            });

            // Share the file so user can save it or send it
            await Share.share({
                title: 'Export File',
                url: result.uri,
                dialogTitle: 'Save or share your export',
            });
        } catch (error) {
            console.error('Export failed on native platform. File write or share operation unsuccessful:', error);
            // Fallback to web method - may still work on some devices
            exportFileWeb(data, filename, mimeType);
        }
    } else {
        // Web browser - use blob download
        exportFileWeb(data, filename, mimeType);
    }
}

/**
 * Web-only file export using blob and download link
 */
function exportFileWeb(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export CSV file
 */
export async function exportCSV(data: string, filename: string): Promise<void> {
    return exportFile(data, filename, 'text/csv');
}

/**
 * Export JSON file
 */
export async function exportJSON(data: string, filename: string): Promise<void> {
    return exportFile(data, filename, 'application/json');
}
