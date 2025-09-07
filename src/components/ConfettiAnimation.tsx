import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

import { theme } from '../utils/theme';

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
}

interface ConfettiAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  duration?: number;
  pieceCount?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
];

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  visible,
  onComplete,
  duration = 3000,
  pieceCount = 50,
}) => {
  const confettiPieces = useRef<ConfettiPiece[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Initialize confetti pieces
  useEffect(() => {
    confettiPieces.current = Array.from({ length: pieceCount }, (_, index) => ({
      id: index,
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle',
    }));
  }, [pieceCount]);

  const startAnimation = useCallback(() => {
    // Reset positions
    confettiPieces.current.forEach((piece) => {
      piece.x.setValue(Math.random() * screenWidth);
      piece.y.setValue(-50);
      piece.rotation.setValue(0);
    });

    // Create animations for each piece
    const animations = confettiPieces.current.map((piece) => {
      const fallDistance = screenHeight + 100;
      const horizontalDrift = (Math.random() - 0.5) * 200;
      const rotationAmount = Math.random() * 720 + 360; // 1-3 full rotations

      return Animated.parallel([
        // Falling animation with slight horizontal drift
        Animated.timing(piece.y, {
          toValue: fallDistance,
          duration: duration + Math.random() * 1000, // Vary duration slightly
          useNativeDriver: true,
        }),
        // Horizontal drift
        Animated.timing(piece.x, {
          toValue: horizontalDrift,
          duration: duration + Math.random() * 1000,
          useNativeDriver: true,
        }),
        // Rotation animation
        Animated.timing(piece.rotation, {
          toValue: rotationAmount,
          duration: duration + Math.random() * 1000,
          useNativeDriver: true,
        }),
      ]);
    });

    // Start all animations
    animationRef.current = Animated.stagger(50, animations);
    animationRef.current.start((finished) => {
      if (finished && onComplete) {
        onComplete();
      }
    });
  }, [duration, onComplete]);

  // Start animation when visible
  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [duration, startAnimation, visible]);

  const stopAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  };

  const renderConfettiPiece = (piece: ConfettiPiece) => {
    const transform = [
      {
        translateX: piece.x,
      },
      {
        translateY: piece.y,
      },
      {
        rotate: piece.rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
      {
        scale: piece.scale,
      },
    ];

    let shapeStyle;
    switch (piece.shape) {
      case 'circle':
        shapeStyle = styles.circle;
        break;
      case 'square':
        shapeStyle = styles.square;
        break;
      case 'triangle':
        shapeStyle = styles.triangle;
        break;
      default:
        shapeStyle = styles.circle;
    }

    return (
      <Animated.View
        key={piece.id}
        style={[
          styles.confettiPiece,
          shapeStyle,
          {
            backgroundColor: piece.color,
            transform,
          },
        ]}
      />
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.current.map(renderConfettiPiece)}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    borderRadius: 4,
  },
  confettiPiece: {
    height: 8,
    position: 'absolute',
    width: 8,
  },
  container: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  square: {
    borderRadius: 1,
  },
  triangle: {
    backgroundColor: theme.colors.transparent,
    borderBottomWidth: 8,
    borderLeftColor: theme.colors.transparent,
    borderLeftWidth: 4,
    borderRightColor: theme.colors.transparent,
    borderRightWidth: 4,
    borderStyle: 'solid',
    height: 0,
    width: 0,
  },
});

export default ConfettiAnimation;