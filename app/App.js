import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Linking, Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { WebView } from 'react-native-webview';
import PAGE from './src/page.generated';
import { API_URL, BG, PAGE_URL } from './src/config';
import { loadState, saveKey } from './src/storage';

SplashScreen.preventAutoHideAsync().catch(() => {});

// The phone app shows the same Adulted screens as the website, bundled inside the app so the
// guides work offline (basements, laundry rooms, power outages). This file connects them to the
// phone: saved data, the back button, and links like phone numbers.
export default function App() {
  const [state, setState] = useState(null);
  const web = useRef(null);
  const canGoBack = useRef(false);

  useEffect(() => { loadState().then(setState); }, []);

  // Android back button steps back through the app's screens before leaving the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current && web.current) { web.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, []);

  const injected = useMemo(() => {
    if (!state) return '';
    return `window.ADULTED_API=${JSON.stringify(API_URL ? `${API_URL}/api` : null)};
window.ADULTED_MEDIA=${JSON.stringify(API_URL ? `${API_URL}/app/media/` : 'media/')};
window.__AD_STATE=${JSON.stringify(state)};
true;`;
  }, [state]);

  const onMessage = useCallback((e) => {
    let msg;
    try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg && msg.type === 'store') saveKey(msg.key, msg.value);
  }, []);

  // Phone numbers, email, and other websites open outside the app.
  const onShouldStart = useCallback((req) => {
    const url = req.url || '';
    if (url.startsWith(PAGE_URL) || url.startsWith('about:') || url.startsWith('data:')) return true;
    if (/^(https?|mailto|tel|sms):/i.test(url)) Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />
        {state ? (
          <WebView
            ref={web}
            source={{ html: PAGE, baseUrl: PAGE_URL }}
            originWhitelist={['*']}
            injectedJavaScriptBeforeContentLoaded={injected}
            onMessage={onMessage}
            onShouldStartLoadWithRequest={onShouldStart}
            onNavigationStateChange={(n) => { canGoBack.current = n.canGoBack; }}
            onLoadEnd={() => SplashScreen.hideAsync().catch(() => {})}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            bounces={false}
            overScrollMode="never"
            textZoom={100}
            style={{ flex: 1, backgroundColor: BG }}
            containerStyle={{ backgroundColor: BG }}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: BG }} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
