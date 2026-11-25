import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import QRCode from 'qrcode';

/**
 * Renders a scannable QR code offline using vector SVG paths so
 * receipt & statement cards never show a blank box when offline or before image load.
 */
export const OfflineQrSvg = ({ value, size = 95, quietZone = 2 }) => {
  const { pathD, viewBoxSize } = useMemo(() => {
    if (!value) return { pathD: '', viewBoxSize: 21 };
    try {
      const qr = QRCode.create(String(value), { errorCorrectionLevel: 'M' });
      const modules = qr.modules;
      const count = modules.size;
      const data = modules.data;
      const parts = [];

      for (let r = 0; r < count; r += 1) {
        let c = 0;
        while (c < count) {
          if (data[r * count + c]) {
            let run = 1;
            while (c + run < count && data[r * count + c + run]) {
              run += 1;
            }
            const x = c + quietZone;
            const y = r + quietZone;
            parts.push(`M${x} ${y}h${run}v1h-${run}z`);
            c += run;
          } else {
            c += 1;
          }
        }
      }

      return { pathD: parts.join(''), viewBoxSize: count + quietZone * 2 };
    } catch (_e) {
      return { pathD: '', viewBoxSize: 21 };
    }
  }, [value, quietZone]);

  if (!pathD) {
    return <View style={{ width: size, height: size, backgroundColor: '#FFFFFF' }} />;
  }

  return (
    <View style={{ width: size, height: size, backgroundColor: '#FFFFFF' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <Rect x={0} y={0} width={viewBoxSize} height={viewBoxSize} fill="#FFFFFF" />
        <Path d={pathD} fill="#000000" />
      </Svg>
    </View>
  );
};
