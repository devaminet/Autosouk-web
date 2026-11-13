import type { ReactNode } from "react";

type CameraFrameProps = {
  children: ReactNode;
  // Shown over the picture, such as the instruction or a play button.
  overlay?: ReactNode;
  dimmed?: boolean;
};

// The dark picture area with the oval to keep the face in.
export function CameraFrame({ children, overlay, dimmed = false }: CameraFrameProps) {
  return (
    <div className={`relative h-camera overflow-hidden rounded-xl bg-night ${dimmed ? "opacity-60" : ""}`}>
      {children}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="h-oval-h w-oval-w rounded-full border-4 border-on-brand" />
      </div>
      {overlay}
    </div>
  );
}
