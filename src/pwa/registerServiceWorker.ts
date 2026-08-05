/**
 * Service Worker の登録。
 *
 * キャッシュ対象はアプリの静的ファイルのみで、計算履歴や計算途中の状態は
 * Service Worker / Cache API へ一切保存しない。
 * registerType: 'autoUpdate' により、新しいビルドを検出すると
 * 古いキャッシュを破棄して置き換える。
 */
export function registerServiceWorker(): void {
  if (import.meta.env.DEV) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onRegisterError(error: unknown) {
          console.warn('Service Worker の登録に失敗しました', error);
        },
      });
    })
    .catch((error: unknown) => {
      console.warn('Service Worker モジュールの読み込みに失敗しました', error);
    });
}
