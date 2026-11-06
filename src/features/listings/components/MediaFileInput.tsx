import { acceptedFiles } from "../media";

type MediaFileInputProps = {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  // Opens the camera on phones. Photos only.
  camera?: boolean;
  // Visually hidden by default. Put it inside a label that shows what it does.
  className?: string;
  onDragActive?: (isActive: boolean) => void;
};

export function MediaFileInput({
  onFiles,
  disabled,
  camera = false,
  className = "sr-only",
  onDragActive,
}: MediaFileInputProps) {
  return (
    <input
      accept={camera ? "image/*" : acceptedFiles}
      capture={camera ? "environment" : undefined}
      className={className}
      disabled={disabled}
      multiple={!camera}
      onChange={(event) => {
        onDragActive?.(false);
        onFiles(Array.from(event.target.files ?? []));
        // Picking the same file again must fire a change.
        event.target.value = "";
      }}
      onDragEnter={() => onDragActive?.(true)}
      onDragLeave={() => onDragActive?.(false)}
      type="file"
    />
  );
}
