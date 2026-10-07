import { radius } from '@project-connect/design-tokens';
import { AppLogo, useTheme } from '@project-connect/ui';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * B3 abstract "connection geometry" hero (V1 §10–§11): soft shapes and linked
 * nodes in the indigo / coral / teal palette. Deliberately no people yet —
 * approved editorial illustration or photography replaces this later.
 * Decorative: hidden from assistive technology.
 */

interface Node {
  readonly x: number; // fractions of the artwork box
  readonly y: number;
  readonly size: number; // points
  readonly tone: 'mark' | 'indigo' | 'coral' | 'teal' | 'indigoSoft';
}

const NODES: readonly Node[] = [
  { x: 0.24, y: 0.42, size: 72, tone: 'indigoSoft' },
  { x: 0.24, y: 0.42, size: 18, tone: 'mark' },
  { x: 0.5, y: 0.3, size: 44, tone: 'mark' },
  { x: 0.74, y: 0.55, size: 26, tone: 'coral' },
  { x: 0.44, y: 0.72, size: 34, tone: 'teal' },
  { x: 0.82, y: 0.24, size: 12, tone: 'indigo' },
];

/** Pairs of NODES indices joined by a thin line. */
const LINKS: readonly [number, number][] = [
  [1, 2],
  [2, 3],
  [1, 4],
  [4, 3],
  [2, 5],
];

export function ConnectionArtwork({
  width,
  height,
  showBrand = false,
}: {
  readonly width: number;
  readonly height: number;
  readonly showBrand?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const fill = {
    mark: colors.brand.mark,
    indigo: colors.decor.indigo,
    indigoSoft: colors.decor.indigoSoft,
    coral: colors.decor.coral,
    teal: colors.decor.teal,
  };
  // Nodes sit in the area below the status bar.
  const top = insets.top;
  const area = height - top;
  const at = (node: Node) => ({ x: node.x * width, y: top + node.y * area });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { height, backgroundColor: colors.surface.secondary }]}
    >
      <View style={[styles.blob, styles.blobA, { backgroundColor: colors.decor.indigoSoft }]} />
      <View style={[styles.blob, styles.blobB, { backgroundColor: colors.decor.coralSoft }]} />
      <View style={[styles.blob, styles.blobC, { backgroundColor: colors.decor.tealSoft }]} />

      {LINKS.map(([from, to]) => {
        const a = NODES[from];
        const b = NODES[to];
        if (a === undefined || b === undefined) return null;
        const p = at(a);
        const q = at(b);
        const length = Math.hypot(q.x - p.x, q.y - p.y);
        const angle = Math.atan2(q.y - p.y, q.x - p.x);
        return (
          <View
            key={`${String(from)}-${String(to)}`}
            style={[
              styles.link,
              {
                width: length,
                left: (p.x + q.x) / 2 - length / 2,
                top: (p.y + q.y) / 2 - 1,
                backgroundColor: colors.decor.indigo,
                transform: [{ rotate: `${String(angle)}rad` }],
              },
            ]}
          />
        );
      })}

      {NODES.map((node, index) => {
        const c = at(node);
        return (
          <View
            // Static artwork: index is a stable identity.
            key={index}
            style={[
              styles.node,
              {
                width: node.size,
                height: node.size,
                left: c.x - node.size / 2,
                top: c.y - node.size / 2,
                backgroundColor: fill[node.tone],
              },
            ]}
          />
        );
      })}

      {showBrand && (
        <View style={[styles.brand, { top: top + 12 }]}>
          <AppLogo size={30} wordmark="beside" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    borderBottomLeftRadius: radius.panel,
    borderBottomRightRadius: radius.panel,
  },
  blob: { position: 'absolute', borderRadius: radius.full, opacity: 0.9 },
  blobA: { width: 220, height: 220, left: -70, top: 40 },
  blobB: { width: 150, height: 150, right: -30, top: 20 },
  blobC: { width: 190, height: 190, right: -40, bottom: -70 },
  link: { position: 'absolute', height: 2, opacity: 0.5 },
  node: { position: 'absolute', borderRadius: radius.full },
  brand: { position: 'absolute', left: 24 },
});
