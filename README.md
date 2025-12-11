# Reanimated Tab View

<a href="./assets/instagram_demo.mp4"><img src="./assets/instagram_demo.gif" style="display: block; margin: 0 auto;"></a>

A Tab View component built with [`react-native-reanimated`](https://github.com/software-mansion/react-native-reanimated/) and [`react-native-gesture-handler`](https://github.com/software-mansion/react-native-gesture-handler/). API compatible with [`react-native-tab-view`](https://github.com/satya164/react-native-tab-view).

## Features

- Smooth animations and gestures
- Scrollable tabs with dynamic widths
- Top and bottom tab bar positions
- Material Design spec compliant
- Fully typed with TypeScript

**Additional features over react-native-tab-view:**

- **Collapsible headers** (Instagram-style)

  <img src="./assets/collapsible_header.gif" width="360">

- **Render modes** (`renderMode` prop):
  - `all` (default) - Renders all scenes on mount
  - `windowed` - Renders current + adjacent scenes
  - `lazy` - Renders scenes on first visit

- **Jump modes** (`jumpMode` prop):
  - `smooth` (default) - Animates directly to target tab
  - `scrolling` - Scrolls through intermediate tabs
  - `no-animation` - Instant jump

  |                   Smooth Jump                    |                   Scroll Jump                    |
  | :----------------------------------------------: | :----------------------------------------------: |
  | <img src="./assets/smooth_jump.gif" width="360"> | <img src="./assets/scroll_jump.gif" width="360"> |

## Installation

Requires react-native-reanimated (>=4.x) and react-native-gesture-handler (>=2.x).

```sh
yarn add git+https://github.com/papaya-shine/reanimated-tab-view
```

**Optional:** For high-performance lists, install [@shopify/flash-list](https://shopify.github.io/flash-list/):

```sh
yarn add @shopify/flash-list
```

## Quick Start

```js
import { TabView } from 'reanimated-tab-view';

export default function TabViewExample() {
  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'first', title: 'First' },
    { key: 'second', title: 'Second' },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <FirstRoute />;
      case 'second':
        return <SecondRoute />;
      default:
        return null;
    }
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
    />
  );
}
```

## Scrollable Components

Use these components inside your scenes for proper scroll coordination:

| Component | Base | Use Case |
|-----------|------|----------|
| `RTVScrollView` | ScrollView | Static content |
| `RTVFlatList` | FlatList | Standard lists |
| `RTVFlashList` | FlashList | Large lists, grids |

All components support:
- Collapsible headers (via `renderHeader` prop on TabView)
- Pull-to-refresh (via TabView props or custom `refreshControl`)

### Example with FlashList

```js
import { TabView, RTVFlashList } from 'reanimated-tab-view';

const ProductGrid = ({ route }) => (
  <RTVFlashList
    data={products}
    renderItem={({ item }) => <ProductCard product={item} />}
    estimatedItemSize={200}  // Required for FlashList
    numColumns={2}
  />
);

<TabView
  navigationState={{ index, routes }}
  renderScene={renderScene}
  renderHeader={() => <ProfileHeader />}
  onRefresh={handleRefresh}
  refreshing={isRefreshing}
  refreshControlColor="#ff6600"
  onIndexChange={setIndex}
/>
```

### Custom RefreshControl (Static Mode)

Without collapsible headers, pass `refreshControl` directly to scrollable components:

```js
<RTVFlatList
  data={items}
  renderItem={({ item }) => <ItemRow item={item} />}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#ff6600"
      colors={['#ff6600']}
      progressBackgroundColor="#fff"
    />
  }
/>
```

## Architecture: Collapsible Headers

The collapsible header implementation uses a single-scroll-master architecture for seamless gesture handling:

```
┌─────────────────────────────────────┐
│ Outer ScrollView (master)           │  ← Handles ALL vertical gestures
│ ┌─────────────────────────────────┐ │
│ │ Header                          │ │  ← Scrolls away naturally
│ ├─────────────────────────────────┤ │
│ │ Tab Bar (sticky)                │ │  ← stickyHeaderIndices={[1]}
│ ├─────────────────────────────────┤ │
│ │ Content Area                    │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Inner List (scrollEnabled=  │ │ │  ← Synced via scrollTo()
│ │ │ false)                      │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### How It Works

1. **Single Gesture Owner**: The outer `ScrollView` captures all vertical touch events. Inner lists have `scrollEnabled={false}`, preventing gesture conflicts.

2. **Scroll Position Sync**: As the user scrolls, positions are mapped on the UI thread:
   ```
   outerScrollY: 0 → headerHeight → headerHeight + maxContentScroll
   innerScrollY: 0 → 0            → maxContentScroll
   
   innerScrollY = max(0, outerScrollY - headerHeight)
   ```

3. **UI Thread Updates**: Inner list scroll position is updated via `useAnimatedReaction` + `scrollTo()`, running entirely on the UI thread for 60fps sync.

4. **Sticky Tab Bar**: Uses native `stickyHeaderIndices={[1]}` so the tab bar sticks when the header collapses.

5. **Native RefreshControl**: Because the outer ScrollView owns gestures, pull-to-refresh works natively without custom gesture handling.

6. **Content Height Reporting**: Inner lists report their content height to the context. The outer scroll's content size is calculated as:
   ```
   outerContentHeight = headerHeight + tabBarHeight + viewportHeight + maxInnerScroll
   ```

7. **onEndReached Emulation**: Since inner lists have `scrollEnabled={false}`, native `onEndReached` won't fire. The library monitors scroll position and triggers it manually when the threshold is reached.

### Why This Approach?

- **Gesture continuity**: Single scroll owner means no gesture handoff issues
- **Native feel**: Uses platform ScrollView physics and RefreshControl
- **Performance**: All sync happens on UI thread via Reanimated worklets
- **Simplicity**: No complex pan gesture responder chains

## Props

### TabView Props

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `navigationState` | Current index and routes | `{index: number; routes: Route[]}` | Required |
| `renderScene` | Renders each tab's content | `(props: SceneRendererProps) => ReactNode` | Required |
| `onIndexChange` | Called when tab changes | `(index: number) => void` | Required |
| `renderHeader` | Renders collapsible header | `(props: HeaderRendererProps) => ReactNode` | - |
| `tabBarConfig` | Tab bar configuration (see below) | `TabBarConfig` | - |
| `renderMode` | Scene rendering strategy | `'all' \| 'windowed' \| 'lazy'` | `'all'` |
| `jumpMode` | Tab switch animation | `'smooth' \| 'scrolling' \| 'no-animation'` | `'smooth'` |
| `swipeEnabled` | Enable swipe gestures | `boolean` | `true` |
| `keyboardDismissMode` | Keyboard dismiss behavior | `'auto' \| 'on-drag' \| 'none'` | `'auto'` |
| `refreshing` | Pull-to-refresh active state | `boolean` | `false` |
| `onRefresh` | Pull-to-refresh callback | `() => void` | - |
| `refreshControlColor` | Spinner color (iOS tintColor, Android colors) | `string` | - |
| `refreshControlBackgroundColor` | Background color (Android only) | `string` | - |
| `animatedRouteIndex` | Shared value for animated index | `SharedValue<number>` | - |
| `initialLayout` | Initial dimensions to reduce layout jitter | `{tabView?, tabViewHeader?, tabBar?}` | - |
| `style` | Container style | `StyleProp<ViewStyle>` | - |
| `sceneContainerStyle` | Scene container style | `StyleProp<ViewStyle>` | - |
| `tabViewCarouselStyle` | Carousel style | `StyleProp<ViewStyle>` | - |
| `sceneContainerGap` | Gap between scenes | `number` | `0` |
| `onSwipeStart` | Swipe gesture start callback | `() => void` | - |
| `onSwipeEnd` | Swipe gesture end callback | `() => void` | - |

### TabBarConfig

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `tabBarPosition` | Tab bar position | `'top' \| 'bottom'` | `'top'` |
| `tabBarType` | Material Design type | `'primary' \| 'secondary'` | `'secondary'` |
| `tabBarScrollEnabled` | Enable horizontal scroll | `boolean` | `true` |
| `tabBarDynamicWidthEnabled` | Dynamic tab widths | `boolean` | `true` for primary |
| `scrollableTabWidth` | Fixed tab width (when scrollEnabled) | `number` | `100` |
| `tabBarStyle` | Tab bar container style | `StyleProp<ViewStyle>` | - |
| `tabStyle` | Individual tab style | `StyleProp<ViewStyle>` | - |
| `tabLabelStyle` | Tab label text style | `StyleProp<TextStyle>` | - |
| `tabBarIndicatorStyle` | Indicator style | `StyleProp<ViewStyle>` | - |
| `renderTabBar` | Custom tab bar renderer | `(props: TabBarProps) => ReactNode` | - |

### Ref Methods

- `jumpTo(routeKey: string)` - Programmatically jump to a tab

## Limitations

- Uses `onLayout` for measurements, which can cause initial render jitter. Use `initialLayout` prop to mitigate.

- **Android: Use touchables from react-native-gesture-handler**
  
  On Android, `TouchableOpacity`, `Pressable`, and other touchables from `react-native` will not work inside tab scenes. Use the equivalents from `react-native-gesture-handler` instead:

  ```js
  // ❌ Won't work on Android
  import { Pressable, TouchableOpacity } from 'react-native';

  // ✅ Works on Android
  import { Pressable, TouchableOpacity } from 'react-native-gesture-handler';
  // or
  import { RectButton, BorderlessButton } from 'react-native-gesture-handler';
  ```

  **Why?** The tab carousel is wrapped in a `GestureDetector` for horizontal swipe handling. On Android, RNGH intercepts touch events at the native level before they reach React Native's responder system. Touchables from RNGH are aware of this gesture system and receive events correctly; React Native's built-in touchables do not.

## License

[MIT](./LICENSE)
