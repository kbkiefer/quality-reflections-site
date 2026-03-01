import { motion } from 'framer-motion';

/**
 * Caustic light blobs for the CTA section.
 *
 * Three radial-gradient shapes drift on infinite Framer Motion
 * keyframe loops, simulating the refracted light patterns you
 * see on walls near glass curtain walls on sunny days.
 *
 * Purely decorative — hidden from assistive technology.
 */
export default function CausticLights() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Primary caustic — slow, wide drift */}
      <motion.div
        className="absolute"
        style={{
          top: '20%',
          left: '20%',
          width: 400,
          height: 400,
          background:
            'radial-gradient(circle, rgba(74,144,217,0.04), transparent 70%)',
        }}
        animate={{
          x: [0, 100, 200, 50, 0],
          y: [0, 60, -40, -80, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary caustic — counter-drift */}
      <motion.div
        className="absolute"
        style={{
          top: '40%',
          right: '15%',
          width: 300,
          height: 300,
          background:
            'radial-gradient(circle, rgba(74,144,217,0.03), transparent 70%)',
        }}
        animate={{
          x: [0, -80, -150, -40, 0],
          y: [0, -50, 30, 70, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Tertiary caustic — neutral white, very faint */}
      <motion.div
        className="absolute"
        style={{
          bottom: '20%',
          left: '40%',
          width: 250,
          height: 250,
          background:
            'radial-gradient(circle, rgba(255,255,255,0.02), transparent 70%)',
        }}
        animate={{
          x: [0, 60, -30, -80, 0],
          y: [0, -60, -120, 40, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
