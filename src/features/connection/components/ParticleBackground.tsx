import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Dimensions, Animated, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

// Number of particles to display - REDUCED for more visible individual movement
const PARTICLE_COUNT = 40; // Reduced from 90 to 40

// Possible colors for the particles - Made more vibrant
const PARTICLE_COLORS = [
  'rgba(29, 185, 255, 0.5)', // Reduced opacity from 0.9 to 0.5
  'rgba(255, 255, 255, 0.4)', // Reduced opacity from 0.8 to 0.4
  'rgba(94, 219, 255, 0.5)', // Reduced opacity from 0.9 to 0.5
  'rgba(0, 143, 255, 0.4)', // Reduced opacity from 0.7 to 0.4
  'rgba(166, 236, 255, 0.5)', // Reduced opacity from 0.9 to 0.5
];

// Animation constants for smoother motion
const MIN_DURATION = 10000; // Longer animation duration for smoother movement
const MAX_DURATION = 20000; // Maximum animation duration
const CONNECTION_DISTANCE = 180; // Distance for connecting lines

interface Particle {
  id: number;
  size: number;
  color: string;
  xAnimation: Animated.Value;
  yAnimation: Animated.Value;
  xDuration: number;
  yDuration: number;
  opacityAnimation: Animated.Value;
  opacityDuration: number;
  rotationAnimation: Animated.Value;
  rotationDuration: number;
  position: { x: number; y: number };
}

const ParticleBackground: React.FC = () => {
  // State for particles
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationsStarted = useRef(false);
  
  // Generate random particles with continuous animations
  useEffect(() => {
    // Generate and animate particles
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Random particle properties
      const size = Math.random() * 9 + 2; // Size between 2-11
      
      // Create animated values with random starting positions
      const xAnimation = new Animated.Value(Math.random() * width);
      const yAnimation = new Animated.Value(Math.random() * height);
      const opacityAnimation = new Animated.Value(Math.random() * 0.5 + 0.3);
      const rotationAnimation = new Animated.Value(0);
      
      // Random durations for each animation component (different for each direction)
      const xDuration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
      const yDuration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
      const opacityDuration = 2000 + Math.random() * 3000;
      const rotationDuration = 5000 + Math.random() * 10000;
      
      newParticles.push({
        id: i,
        size,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        xAnimation,
        yAnimation,
        xDuration,
        yDuration,
        opacityAnimation,
        opacityDuration,
        rotationAnimation,
        rotationDuration,
        position: { x: 0, y: 0 } // Will be updated in animation loop
      });
    }
    
    setParticles(newParticles);
    
    // Start continuous animations for all particles
    if (!animationsStarted.current) {
      animationsStarted.current = true;
      
      // Start animation for each particle with slight delay to prevent synchronization
      newParticles.forEach((particle, index) => {
        // Random delay to stagger animations
        setTimeout(() => {
          animateParticleX(particle);
          animateParticleY(particle);
          animateParticleOpacity(particle);
          animateParticleRotation(particle);
        }, index * 50); // Stagger the start
      });
    }
    
    // Update particle positions for connections
    const positionInterval = setInterval(() => {
      setParticles(currentParticles => {
        return currentParticles.map(p => ({
          ...p,
          position: {
            x: getAnimatedValue(p.xAnimation),
            y: getAnimatedValue(p.yAnimation)
          }
        }));
      });
    }, 16); // ~60fps for smooth connections
    
    // Cleanup on unmount
    return () => {
      clearInterval(positionInterval);
    };
  }, []);

  // Helper function to safely get the current value of an Animated.Value
  const getAnimatedValue = (animValue: Animated.Value): number => {
    let value = 0;
    // @ts-ignore - extracting the value using __getValue which is internal but reliable
    if (animValue.__getValue) {
      // @ts-ignore
      value = animValue.__getValue();
    }
    return value;
  };
  
  // Continuously animate particle X position
  const animateParticleX = (particle: Particle) => {
    // Create a continuous loop of X movement
    Animated.sequence([
      Animated.timing(particle.xAnimation, {
        toValue: Math.random() * width,
        duration: particle.xDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth cubic bezier
        useNativeDriver: true,
      }),
      Animated.timing(particle.xAnimation, {
        toValue: Math.random() * width,
        duration: particle.xDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      })
    ]).start(() => {
      // Modify the duration slightly for variation
      particle.xDuration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
      animateParticleX(particle); // Restart the animation loop
    });
  };
  
  // Continuously animate particle Y position
  const animateParticleY = (particle: Particle) => {
    // Create a continuous loop of Y movement
    Animated.sequence([
      Animated.timing(particle.yAnimation, {
        toValue: Math.random() * height,
        duration: particle.yDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Smooth cubic bezier
        useNativeDriver: true,
      }),
      Animated.timing(particle.yAnimation, {
        toValue: Math.random() * height,
        duration: particle.yDuration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      })
    ]).start(() => {
      // Modify the duration slightly for variation
      particle.yDuration = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
      animateParticleY(particle); // Restart the animation loop
    });
  };
  
  // Animate opacity for twinkling effect
  const animateParticleOpacity = (particle: Particle) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(particle.opacityAnimation, {
          toValue: Math.random() * 0.3 + 0.2, // Reduced from 0.5+0.5 to 0.3+0.2
          duration: particle.opacityDuration,
          easing: Easing.inOut(Easing.sin), // Smooth sine wave pattern
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacityAnimation, {
          toValue: Math.random() * 0.2 + 0.1, // Reduced from 0.3+0.2 to 0.2+0.1
          duration: particle.opacityDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    ).start();
  };
  
  // Animate rotation continuously
  const animateParticleRotation = (particle: Particle) => {
    Animated.loop(
      Animated.timing(particle.rotationAnimation, {
        toValue: 1,
        duration: particle.rotationDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };
  
  // Draw lines between particles that are close to each other
  const renderConnections = () => {
    const connections = [];
    
    // Check each particle against all others
    for (let i = 0; i < particles.length; i++) {
      const particleA = particles[i];
      
      for (let j = i + 1; j < particles.length; j++) {
        const particleB = particles[j];
        
        // Calculate distance between particles
        const dx = Math.abs(particleA.position.x - particleB.position.x);
        const dy = Math.abs(particleA.position.y - particleB.position.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If particles are close enough, draw a connection
        if (distance < CONNECTION_DISTANCE) {
          // Calculate opacity based on distance (closer = more opaque)
          const opacity = 1 - (distance / CONNECTION_DISTANCE);
          
          // Calculate the line position and angle
          const x1 = particleA.position.x;
          const y1 = particleA.position.y;
          const x2 = particleB.position.x;
          const y2 = particleB.position.y;
          
          // Calculate the center point of the line
          const centerX = (x1 + x2) / 2;
          const centerY = (y1 + y2) / 2;
          
          // Calculate the angle
          const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
          
          connections.push(
            <View
              key={`connection-${i}-${j}`}
              style={[
                styles.connection,
                {
                  width: distance,
                  opacity: opacity * 0.3, // Keep this the same to maintain connection visibility
                  left: centerX - (distance / 2),
                  top: centerY,
                  transform: [{ rotate: `${angle}deg` }]
                }
              ]}
            />
          );
        }
      }
    }
    
    return connections;
  };
  
  return (
    <View style={styles.container}>
      {/* Render connections between nearby particles */}
      {renderConnections()}
      
      {/* Render particles */}
      {particles.map(particle => (
        <Animated.View
          key={`particle-${particle.id}`}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              opacity: particle.opacityAnimation,
              transform: [
                { translateX: particle.xAnimation },
                { translateY: particle.yAnimation },
                { 
                  rotate: particle.rotationAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) 
                }
              ]
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  particle: {
    position: 'absolute',
  },
  connection: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default ParticleBackground; 