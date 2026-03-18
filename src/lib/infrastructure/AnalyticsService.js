// src/lib/infrastructure/AnalyticsService.js
import { analytics } from './firebase.js';
import { logEvent } from 'firebase/analytics';

/**
 * Tracks the viewing of the athlete's technical sheet.
 */
export function trackViewAthleteCard() {
  if (!analytics) return;
  logEvent(analytics, 'view_athlete_card');
}

/**
 * Tracks the appearance of the celebration popup.
 * @param {Array<object>} achievements - The list of achievements being celebrated.
 */
export function trackCelebrationPopup(achievements) {
  if (!analytics || !achievements || achievements.length === 0) return;

  const level_achievements = achievements.filter(a => a.type === 'level').map(a => a.name);
  const badge_achievements = achievements.filter(a => a.type === 'badge').map(a => a.name);

  logEvent(analytics, 'show_celebration_popup', {
    levels: level_achievements.join(','),
    badges: badge_achievements.join(','),
    achievement_count: achievements.length
  });
}

/**
 * Tracks when a user shares their progress.
 * @param {string} method - The method used for sharing (e.g., 'Web Share API', 'Download Fallback').
 * @param {string} source - The source from where the share action was initiated (e.g., 'Celebration Popup', 'Leaderboard').
 */
export function trackShare(method, source = 'Unknown') {
  if (!analytics) return;
  logEvent(analytics, 'share_progress', {
    method: method,
    source: source,
  });
}

/**
 * Tracks when the user views the leaderboard.
 */
export function trackViewLeaderboard() {
  if (!analytics) return;
  logEvent(analytics, 'view_leaderboard');
}

/**
 * Tracks when the user views their achievements/objectives popup.
 */
export function trackViewAchievements() {
  if (!analytics) return;
  logEvent(analytics, 'view_achievements');
}

/**
 * Tracks when a push notification is received by the app.
 * @param {string} title - The notification title.
 * @param {'foreground'|'background'|'app_open'} source - How the notification was received.
 */
export function trackNotificationReceived(title, source) {
  if (!analytics) return;
  logEvent(analytics, 'notification_received', {
    notification_title: title,
    source
  });
}

/**
 * Tracks when the user opens the notification history drawer.
 * @param {number} unreadCount - Number of unread notifications at open time.
 */
export function trackNotificationDrawerOpened(unreadCount) {
  if (!analytics) return;
  logEvent(analytics, 'notification_drawer_opened', {
    unread_count: unreadCount
  });
}

/**
 * Tracks when the user dismisses a single notification.
 */
export function trackNotificationDismissed() {
  if (!analytics) return;
  logEvent(analytics, 'notification_dismissed');
}

/**
 * Tracks when the user clears all notifications.
 * @param {number} count - How many notifications were cleared.
 */
export function trackNotificationClearedAll(count) {
  if (!analytics) return;
  logEvent(analytics, 'notification_cleared_all', {
    cleared_count: count
  });
}

// ── Card customisation analytics ──────────────────────────────

/**
 * Tracks when the user opens or closes the card edit mode.
 * @param {boolean} opened - true when entering edit mode, false when leaving.
 */
export function trackCardEditMode(opened) {
  if (!analytics) return;
  logEvent(analytics, 'card_edit_mode', { opened });
}

/**
 * Tracks when the user toggles a sticker on/off in the card editor.
 * @param {string} stickerId - The sticker file ID.
 * @param {boolean} active - true = added, false = removed.
 */
export function trackStickerToggled(stickerId, active) {
  if (!analytics) return;
  logEvent(analytics, 'card_sticker_toggled', { sticker_id: stickerId, active });
}

/**
 * Tracks when the user selects a card background skin.
 * @param {string|null} skinId - The skin ID selected, or null for the default.
 */
export function trackSkinSelected(skinId) {
  if (!analytics) return;
  logEvent(analytics, 'card_skin_selected', { skin_id: skinId ?? 'default' });
}

/**
 * Tracks when the user selects a card frame/border.
 * @param {string|null} frameId - The frame ID selected, or null for none.
 */
export function trackFrameSelected(frameId) {
  if (!analytics) return;
  logEvent(analytics, 'card_frame_selected', { frame_id: frameId ?? 'none' });
}

/**
 * Tracks when the What's New popup is shown to the user.
 */
export function trackWhatsNewShown() {
  if (!analytics) return;
  logEvent(analytics, 'whats_new_shown');
}

/**
 * Tracks when the user dismisses the What's New popup.
 * @param {boolean} neverShowAgain - Whether the user checked "don't show again".
 */
export function trackWhatsNewDismissed(neverShowAgain) {
  if (!analytics) return;
  logEvent(analytics, 'whats_new_dismissed', { never_show_again: neverShowAgain });
}