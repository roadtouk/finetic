"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { Vibrant } from "node-vibrant/browser";

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

interface AuroraProps {
  imageUrl?: string;
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
}

// Cache for extracted colors to avoid re-extracting
const colorCache = new Map<string, string[]>();

// Helper function to interpolate between two colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = new Color(color1);
  const c2 = new Color(color2);
  
  const r = Math.round((c1.r * 255) * (1 - factor) + (c2.r * 255) * factor);
  const g = Math.round((c1.g * 255) * (1 - factor) + (c2.g * 255) * factor);
  const b = Math.round((c1.b * 255) * (1 - factor) + (c2.b * 255) * factor);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function Aurora(props: AuroraProps) {
  const {
    imageUrl,
    colorStops = ["#5227FF", "#7cff67", "#5227FF"],
    amplitude = 1.0,
    blend = 0.5,
  } = props;
  const propsRef = useRef<AuroraProps>(props);
  propsRef.current = props;

  const ctnDom = useRef<HTMLDivElement>(null);
  const transitionProgressRef = useRef(0);
  const startColorsRef = useRef<string[]>(colorStops);
  const isTransitioningRef = useRef(false);
  const currentColorsRef = useRef<string[]>(colorStops);
  const [targetColors, setTargetColors] = useState<string[]>(colorStops);
  const [isExtracting, setIsExtracting] = useState(false);
  const currentImageRef = useRef<string>("");

  // Color extraction function
  const extractColors = useCallback(
    async (url: string) => {
      // Check cache first
      if (colorCache.has(url)) {
        const cachedColors = colorCache.get(url)!;
        setTargetColors(cachedColors);
        return;
      }

      // Prevent multiple simultaneous extractions
      if (isExtracting) {
        return;
      }

      setIsExtracting(true);
      currentImageRef.current = url;

      try {
        // Use a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Color extraction timeout")), 3000);
        });

        const extractionPromise = Vibrant.from(url).getPalette();

        const palette = (await Promise.race([
          extractionPromise,
          timeoutPromise,
        ])) as any;

        // Check if this is still the current image (prevents race conditions)
        if (currentImageRef.current !== url) {
          return;
        }

        // Extract colors in order of preference: Vibrant, DarkVibrant, Muted
        const colors: string[] = [];

        if (palette.Vibrant) colors.push(palette.Vibrant.hex);
        if (palette.DarkVibrant) colors.push(palette.DarkVibrant.hex);
        if (palette.Muted) colors.push(palette.Muted.hex);
        if (palette.DarkMuted) colors.push(palette.DarkMuted.hex);
        if (palette.LightVibrant) colors.push(palette.LightVibrant.hex);
        if (palette.LightMuted) colors.push(palette.LightMuted.hex);

        // Ensure we have at least 3 colors for the aurora
        while (colors.length < 3) {
          colors.push(colors[colors.length - 1] || colorStops[0]);
        }

        // Use the first 3 colors for aurora
        const finalColors = colors.slice(0, 3);

        // Cache the result
        colorCache.set(url, finalColors);

        // Only update if this is still the current image
        if (currentImageRef.current === url) {
          setTargetColors(finalColors);
        }
      } catch (error) {
        console.warn(
          "Failed to extract colors from image, using default colors:",
          error
        );
        if (currentImageRef.current === url) {
          setTargetColors(colorStops);
        }
      } finally {
        setIsExtracting(false);
      }
    },
    [colorStops, isExtracting]
  );

  // Extract colors from image when imageUrl changes
  useEffect(() => {
    if (!imageUrl) {
      setTargetColors(colorStops);
      return;
    }

    // Debounce the extraction to prevent rapid calls
    const timeoutId = setTimeout(() => {
      extractColors(imageUrl);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [imageUrl, extractColors]);

  // Handle color transitions
  useEffect(() => {
    if (JSON.stringify(targetColors) === JSON.stringify(currentColorsRef.current)) {
      return;
    }

    // Start transition
    startColorsRef.current = [...currentColorsRef.current];
    transitionProgressRef.current = 0;
    isTransitioningRef.current = true;
  }, [targetColors]);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    // Prevent white flash by setting canvas styles immediately
    gl.canvas.style.backgroundColor = "transparent";
    gl.canvas.style.opacity = "0";
    gl.canvas.style.transition = "opacity 0.3s ease-in-out";

    // eslint-disable-next-line prefer-const
    let program: Program | undefined;

    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = [width, height];
      }
    }
    window.addEventListener("resize", resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);
    
    // Show canvas after first render to prevent flash
    let hasRendered = false;

    let animateId = 0;
    const update = (t: number) => {
      animateId = requestAnimationFrame(update);
      const { time = t * 0.01, speed = 1.0 } = propsRef.current;
      
      // Handle color transition
      if (isTransitioningRef.current) {
        transitionProgressRef.current += 0.02; // Adjust speed as needed (0.02 = ~1 second transition)
        
        if (transitionProgressRef.current >= 1) {
          // Transition complete
          transitionProgressRef.current = 1;
          isTransitioningRef.current = false;
          currentColorsRef.current = [...targetColors];
        } else {
          // Interpolate colors during transition
          const progress = transitionProgressRef.current;
          // Use easing function for smoother transition
          const easedProgress = progress * progress * (3 - 2 * progress); // smoothstep
          
          currentColorsRef.current = startColorsRef.current.map((startColor, index) => {
            const targetColor = targetColors[index] || startColor;
            return interpolateColor(startColor, targetColor, easedProgress);
          });
        }
      }
      
      if (program) {
        program.uniforms.uTime.value = time * speed * 0.1;
        program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? 1.0;
        program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
        
        // Use current interpolated colors
        program.uniforms.uColorStops.value = currentColorsRef.current.map((hex: string) => {
          const c = new Color(hex);
          return [c.r, c.g, c.b];
        });
        
        renderer.render({ scene: mesh });
        
        // Show canvas after first render
        if (!hasRendered) {
          hasRendered = true;
          gl.canvas.style.opacity = "1";
        }
      }
    };
    animateId = requestAnimationFrame(update);

    resize();

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [amplitude, blend, colorStops, targetColors]);

  return <div ref={ctnDom} className="w-full h-full" />;
}
